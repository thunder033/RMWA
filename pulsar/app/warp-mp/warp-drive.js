/**
 * Created by gjr8050 on 3/27/2017.
 */

const DataFormat = require('game-params').DataFormat;
const EntityType = require('entity-types').EntityType;
const MDT = require('../mallet/mallet.dependency-tree').MDT;

module.exports =  {warpDriveFactory,
resolve: ADT => [
    ADT.game.LerpedEntity,
    ADT.network.NetworkEntity,
    warpDriveFactory]};

function warpDriveFactory(LerpedEntity, NetworkEntity) {

    class WarpDrive extends LerpedEntity {
        constructor(params, id) {
            super(id, DataFormat.WARP_DRIVE);

            this.sliceIndex = 0;
            this.barOffset = 0;

            this.prevSliceIndex = 0;
            this.prevBarOffset = 0;

            this.sliceIndexDelta = 0;
            this.barOffsetDelta = 0;

            this.sliceEndPct = 0;

            this.curSliceIndex = 0;
            this.curBarOffset = 0;

            this.warpField = null;
            this.level = [];
        }

        load(warpField) {
            this.warpField = warpField;
            this.level = warpField.getLevel();
        }

        sync(buffer, bufferString) {
            super.sync(buffer, bufferString, () => {
                this.prevBarOffset = this.barOffset;
                this.prevSliceIndex = this.sliceIndex;
            });

            this.sliceIndexDelta = this.sliceIndex - this.prevSliceIndex;
            this.curBarOffset = this.prevBarOffset;
            this.curSliceIndex = this.prevSliceIndex;
            this.sliceEndPct = NaN;

            // were assuming there can only be a slice index change of 1
            if(this.sliceIndexDelta > 0) {
                const switchTime = this.barOffset / this.level[this.sliceIndex].speed;
                this.sliceEndPct = (this.syncElapsed - switchTime) / this.syncElapsed;
            }
        }

        getSliceIndex() {
            return this.curSliceIndex;
        }

        getBarOffset() {
            return this.curBarOffset;
        }

        update(dt) {
            super.update(dt);

            if(this.lerpPct > this.sliceEndPct && this.curSliceIndex === this.prevSliceIndex) {
                this.curSliceIndex = this.sliceIndex;
                this.barOffset = 0;
            }

            if(!this.level.length) {
                return;
            }

            this.curBarOffset = this.level[this.curSliceIndex].speed * dt;
        }
    }

    NetworkEntity.registerType(WarpDrive, EntityType.WarpDrive);

    return WarpDrive;
}