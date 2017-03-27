/**
 * Created by gjr8050 on 3/9/2017.
 */

const GameEvent = require('event-types').GameEvent;
const MDT = require('../mallet/mallet.dependency-tree').MDT;
const Track = require('game-params').Track;
const ShipEngine = require('game-params').ShipEngine;
const DataFormat = require('game-params').DataFormat;
const EntityType = require('entity-types').EntityType;

module.exports = {shipFactory,
resolve: ADT => [
    ADT.network.NetworkEntity,
    ADT.network.Connection,
    MDT.Geometry,
    MDT.Scheduler,
    MDT.Math,
    ADT.network.Clock,
    shipFactory]};

/**
 *
 * @param NetworkEntity
 * @param Connection
 * @param Geometry
 * @param Scheduler
 * @param MM
 * @param Clock {Clock}
 * @returns {ClientShip}
 */
function shipFactory(NetworkEntity, Connection, Geometry, Scheduler, MM, Clock) {
    function lerp(a, disp, p) {
        return MM.Vector3.scale(disp, p).add(a);
    }

    class ClientShip extends NetworkEntity {
        constructor(params, id) {
            super(id, DataFormat.SHIP);

            this.disp = MM.vec3(0);

            this.tPrev = new Geometry.Transform();
            this.tDest = new Geometry.Transform();
            this.tRender = new Geometry.Transform()
                .translate(0, 0.2, 2)
                .scaleBy(0.5, 0.35, 0.5)
                .rotateBy(-Math.PI / 9, 0, 0);

            this.updateTS = 0;
            this.lastUpdate = Clock.getNow();
            this.syncElapsed = 0;
            this.lerpPct = 0;
            this.color = MM.vec3(255, 255, 255);

            Object.defineProperty(this, 'positionX', {
                writeable: true,
                set(value) {
                    this.tPrev.position.x = this.tDest.position.x;
                    this.tDest.position.x = value;},
            });

            Scheduler.schedule(this.update.bind(this));
        }

        getColor() {
            return this.color;
        }

        sync(buffer, bufferString) {
            super.sync(buffer, bufferString);

            this.disp = MM.Vector3.subtract(this.tDest.position, this.tPrev.position);

            const updateTime = Clock.getNow();
            this.syncElapsed = updateTime - this.lastUpdate;
            this.lastUpdate = updateTime;

            this.lerpPct = 0;
        }

        getUpdateTime() {
            return this.syncTime;
        }

        strafe(direction) {
            Connection.getSocket().get().emit(GameEvent.command, direction);
        }
        
        update(dt) {
            this.lerpPct += this.syncElapsed > 0 ? dt / this.syncElapsed : 0;
            this.tRender.position.set(lerp(this.tPrev.position, this.disp, this.lerpPct));
            this.tRender.position.y = 0.2;
            this.tRender.position.z = 1.3;
        }

        getTransform() {
            return this.tRender;
        }
    }

    NetworkEntity.registerType(ClientShip, EntityType.Ship);

    return ClientShip;
}
