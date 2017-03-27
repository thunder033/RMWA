/**
 * Created by gjr8050 on 3/27/2017.
 */

const DataFormat = require('game-params').DataFormat;
const EntityType = require('entity-types').EntityType;

module.exports =  {warpDriveFactory,
resolve: ADT => [
    ADT.network.NetworkEntity,
    warpDriveFactory]};

function warpDriveFactory(NetworkEntity) {

    class WarpDrive extends NetworkEntity {
        constructor(params, id) {
            super(id, DataFormat.WARP_DRIVE);
        }
    }

    NetworkEntity.registerType(WarpDrive, EntityType.WarpDrive);
}