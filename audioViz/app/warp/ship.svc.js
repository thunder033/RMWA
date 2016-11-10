/**
 * Created by gjrwcs on 11/10/2016.
 */
"use strict";
/**
 * Controls behavior of the ship and handles scoring
 */
angular.module('pulsar-warp').service('warp.ship', ['MScheduler', 'MCamera', 'MEasel', 'MalletMath', 'MKeyboard', 'MKeys', 'WarpLevel', 'WarpState', 'Geometry', function(MScheduler, MCamera, MEasel, MM, MKeyboard, MKeys, Warp, WarpState, Geometry){
    var self = this,
        velocity = MM.vec3(0),
        destLane = 0,
        moveSpeed = 0.004,
        laneWidth = 1.1,

        bankAngle = MM.vec3(Math.PI / 12, Math.PI / 24, Math.PI / 4),
        bankPct = 0,
        bankRate = 0.008;

    //create the ship's transform
    var tShip = new Geometry.Transform();
    tShip.position = MM.vec3(-laneWidth, -1, -2);
    tShip.scale = MM.vec3(.75, .5, .75);

    this.lane = 0;
    this.score = 0;

    /**
     * Determines if the ship is switching lanes
     * @returns {boolean}
     */
    function isSwitchingLanes() {
        return destLane !== self.lane;
    }

    /**
     * Gets the direction of lane switch
     * @returns {number}
     */
    function getSwitchDirection(){
        return MM.sign(destLane - self.lane);
    }

    /**
     * Checks position of the ship to determine if it has reached the destination lane
     * @returns {boolean}
     */
    function hasReachedLane(){
        var lanePos = (destLane - 1) * laneWidth;
        return getSwitchDirection() > 0 ? tShip.position.x >= lanePos : tShip.position.x <= lanePos;
    }

    /**
     * Calculates how far between the start and dest lanes the ship is
     * @returns {number} 0 to 1
     */
    function getLaneCoord() {
        var relPos = (tShip.position.x + laneWidth) % laneWidth;
        return relPos / laneWidth;
    }

    /**
     * Sets the velocity for movement and increases the bank angle
     * @param dt {number} delta time
     * @param dir {number} sign of direction
     */
    function move(dt, dir) {
        velocity.x = moveSpeed * dir;
        bankPct += bankRate * dt * dir;
        bankPct = MM.clamp(bankPct, -1, 1);
    }

    /**
     * Determines what lane the ship is in from it's position
     * @returns {number} 0 - 2
     */
    function getLaneFromPos(){
        var rightBound = 0;
        while((rightBound - 1) * laneWidth <= tShip.position.x){
            rightBound++;
        }

        return getLaneCoord() > .5 ? rightBound : rightBound - 1;
    }

    WarpState.onState(WarpState.Loading, ()=>{self.score = 0});

    function setDestLane(lane){
        destLane = MM.clamp(lane, 0, 2);
    }

    var activeCtrl = null;
    function switchLane(key){
        activeCtrl = key;
        setDestLane(key === MKeys.Left ? destLane - 1 : destLane + 1);
    }


    MKeyboard.onKeyDown(MKeys.Left, ()=>switchLane(MKeys.Left));
    MKeyboard.onKeyDown(MKeys.Right, ()=>switchLane(MKeys.Right));

    /**
     * Determines if the destination position is in lane bounds
     * @param {number} moveDistance
     * @returns {boolean}
     */
    function isInBounds(moveDistance) {
        var minBound = -laneWidth - moveDistance,
            maxBound = +laneWidth + moveDistance;
        return tShip.position.x <= maxBound && tShip.position.x >= minBound;
    }

    MScheduler.schedule(dt => {

        //Clear out the velocity
        velocity.scale(0);

        /**
         * Move the ship if
         * - there's an active control
         * - and the control is still pressed
         * - and the target position is in the lane bounds
         */
        if(activeCtrl !== null && MKeyboard.isKeyDown(activeCtrl) && isInBounds(moveSpeed * dt)) {
            move(dt, activeCtrl === MKeys.Left ? -1 : 1);
        } //Otherwise, if there's still an active lane switch
        else if(isSwitchingLanes()) {
            move(dt, getSwitchDirection());
            if(hasReachedLane()){ //move until we reach the target lane
                tShip.position.x = (destLane - 1) * laneWidth;
                self.lane = destLane;
                velocity.scale(0);
                activeCtrl = null;
            }
        } //Finally if there's an active control but the key was released
        else if(activeCtrl !== null) {
            //"snaps" the ship to the middle of a lane when the user is releases all controls
            var rightBound = 0; //figure out which lane ship is left of
            while((rightBound - 1) * laneWidth <= tShip.position.x){
                rightBound++;
            }

            //Determine if the ship is close to the left or right lane
            //Then set the destination and current lanes accordingly
            var laneCoord = getLaneCoord();
            destLane = (laneCoord > .5) ? rightBound : rightBound - 1;
            self.lane = (laneCoord > .5) ? rightBound - 1 : rightBound;

            //Conditionally clamp the destination and start lanes
            if(destLane > 2){
                destLane = 2;
                self.lane = 1;
            }
            else if(destLane < 0){
                destLane = 0;
                self.lane = 1;
            }

            //cancel the active movement
            activeCtrl = null;
        }

        //Gradually return the ship to resting rotation if there's no movement
        if(bankPct != 0 && velocity.len2() === 0) {
            var sign = MM.sign(bankPct);
            bankPct -= bankRate * dt * sign;
            bankPct = MM.clamp(bankPct, -1, 1);

            var newSign = MM.sign(bankPct);
            if(newSign !== sign){
                bankPct = 0;
            }
        }

        tShip.position.add(MM.Vector3.scale(velocity, dt));

        var collectOffset = 5, //how many slices ahead of the current slice we're collecting from
            collectSliceIndex = collectOffset + Warp.sliceIndex,
            currentLane = getLaneFromPos();

        if(Warp.warpField && Warp.warpField[collectSliceIndex]){
            Warp.warpField[collectSliceIndex].gems.forEach((gem, lane) => {
                if(gem === 1 && lane === currentLane){
                    self.score++;
                    Warp.warpField[collectSliceIndex].gems[lane] = 2;
                }
            });
        }

        MScheduler.draw(() => {
            //Rotate ship
            tShip.rotation.x = - Math.PI / 9 - Math.abs(bankPct * bankAngle.x);
            tShip.rotation.y = bankPct * bankAngle.y;
            tShip.rotation.z = bankPct * bankAngle.z;

            //Render in slightly muted red
            MCamera.render(Geometry.meshes.Ship, tShip, MM.vec3(225, 20, 20));

            //Draw Shadow
            MEasel.context.fillStyle = 'rgba(0,0,0,.25)';
            //MCamera.drawShape(Shapes.Triangle, MM.vec3(tShip.position.x, 0, tShip.position.z), shipWidth * Math.cos(bankAngle), 10, 0);

        }, 10);
    });
}]);