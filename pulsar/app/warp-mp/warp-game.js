/**
 * Created by gjr8050 on 3/10/2017.
 */

const EntityTypes = require('entity-types').EntityTypes;
module.exports = {warpGameFactory,
resolve: ADT => [
    ADT.game.Player,
    ADT.network.NetworkEntity,
    ADT.game.ClientShip,
    ADT.network.User,
    ADT.ng.$q,
    ADT.network.ClientRoom,
    ADT.game.WarpField,
    warpGameFactory]};

function warpGameFactory(Player, NetworkEntity, ClientShip, User, $q, ClientRoom, WarpField) {
    const utf8Decoder = new TextDecoder('utf-8');
    function createPlayers(buffer, match) {
        const players = [];

        const view = new DataView(buffer);
        const bufferString = utf8Decoder.decode(view);

        for (let i = 0; i * NetworkEntity.ID_LENGTH < bufferString.length; i += 2) {
            const userId = bufferString.substr(i * NetworkEntity.ID_LENGTH, NetworkEntity.ID_LENGTH);
            const shipId = bufferString.substr((i + 1) * NetworkEntity.ID_LENGTH, NetworkEntity.ID_LENGTH);
            console.log(`create player for ship ${shipId} and user ${userId}`);
            players.push($q.all([
                // Resolve the entities associated with the player
                NetworkEntity.getById(User, userId),
                NetworkEntity.getById(ClientShip, shipId),
                // jshint -W083: false
            ]).spread((user, ship) => {
                const player = new Player(user, match, ship);
                // The player is identified by the user id, so get player data from the server
                return player.requestSync();
            }));
        }

        return $q.all(players);
    }

    /**
     * @type WarpGame
     */
    class ClientSimulation extends NetworkEntity {
        /**
         * @constructor
         */
        constructor(params) {
            super(params.id);
            this.match = null;
            this.players = [];
            this.warpField = null;
        }

        /**
         * @param params {{matchId, shipIds}}
         * @returns {*}
         */
        sync(params) {
            const getMatch = NetworkEntity.getById(ClientRoom, params.matchId);
            const getWarpField = NetworkEntity.getById(WarpField, params.warpFieldId);

            return $q.all([getMatch, getWarpField]).spread((match, warpField) => {
                this.warpField = warpField;
                this.match = match;
                return createPlayers(params.shipIds, match).then((players) => { this.players = players; });
            }).finally(() => {
                delete params.matchId;
                delete params.shipIds;
                super.sync(params);
            });
        }

        getWarpField() {
            return this.warpField;
        }

        getPlayers() {
            return this.players;
        }

        getMatch() {
            return this.match;
        }
    }

    NetworkEntity.registerType(ClientSimulation, EntityTypes.Simulation);

    return ClientSimulation;
}
