/**
 * Created by gjrwcs on 11/10/2016.
 */
angular.module('pulsar-warp').service('warp.ship', ['MScheduler', 'MCamera', 'MEasel', 'MalletMath', 'MKeyboard', 'MKeys', 'WarpLevel', 'WarpState', 'Geometry', function(MScheduler, MCamera, MEasel, MM, MKeyboard, MKeys, Warp, WarpState, Geometry){
    var self = this,
        velocity = MM.vec3(0),
        destLane = 0,
        moveSpeed = 0.0035,
        laneWidth = 1.1,
        bankAngle = Math.PI / 4,
        bankPct = 0,
        bankRate = 0.003,
        tShip = new Geometry.Transform();

    tShip.position = MM.vec3(-laneWidth, -1, -2);
    tShip.scale = MM.vec3(.75, .5, .75);

    this.lane = 0;
    this.score = 0;

    function isSwitchingLanes() {
        return destLane !== self.lane;
    }

    function getSwitchDirection(){
        return (destLane - self.lane)
    }

    function hasReachedLane(){
        var lanePos = (destLane - 1) * laneWidth;
        return getSwitchDirection() > 0 ? tShip.position.x >= lanePos : tShip.position.x <= lanePos;
    }

    function getLaneSwitchPct() {
        if(destLane === self.lane){
            return 0;
        }

        var disp = (destLane - self.lane) * laneWidth,
            relPos = (tShip.position.x + laneWidth) % laneWidth;
        return disp < 1 ? 1 - (relPos) / Math.abs(disp) : (relPos) / Math.abs(disp);
    }

    function getLaneCoord() {
        var relPos = (tShip.position.x + laneWidth) % laneWidth;
        return relPos / laneWidth;
    }

    function move(dt, dir) {
        tShip.position.x += moveSpeed * dt * dir;
        bankPct += bankRate * dt * dir;
        bankPct = Math.min(Math.max(bankPct, -1), 1);
    }

    function getLaneFromPos(){
        var rightBound = 0;
        while((rightBound - 1) * laneWidth <= tShip.position.x){
            rightBound++;
        }

        return getLaneCoord() > .5 ? rightBound : rightBound - 1;
    }

    WarpState.onState(WarpState.Loading, ()=>{self.score = 0});

    var transforms = new Array(20);

    for(var i = 0; i < 20; i++){
        transforms[i] = new Geometry.Transform();
        transforms[i].position = MM.vec3(-5 + i * .5, 0, -10.3);
        transforms[i].scale = MM.vec3(.35);
        //MCamera.render(Geometry.meshes.Cube, transform, "#f0f");
    }

    var activeCtrl = null;
    MKeyboard.onKeyDown(MKeys.Left, ()=>activeCtrl=MKeys.Left);
    MKeyboard.onKeyDown(MKeys.Right, ()=>activeCtrl=MKeys.Right);

    function isInBounds(moveDistance) {
        var minBound = -laneWidth - moveDistance,
            maxBound = +laneWidth + moveDistance;
        return tShip.position.x <= maxBound && tShip.position.x >= minBound;
    }

    MScheduler.schedule(dt => {

        if(activeCtrl !== null && MKeyboard.isKeyDown(activeCtrl) && isInBounds(moveSpeed * dt)) {
            move(dt, activeCtrl === MKeys.Left ? -1 : 1);
        }
        else if(activeCtrl !== null) {
            var rightBound = 0;
            while((rightBound - 1) * laneWidth <= tShip.position.x){
                rightBound++;
            }

            var laneCoord = getLaneCoord();
            destLane = (laneCoord > .5) ? rightBound : rightBound - 1;
            self.lane = (laneCoord > .5) ? rightBound - 1 : rightBound;

            if(destLane > 2){
                destLane = 2;
                self.lane = 1;
            }
            else if(destLane < 0){
                destLane = 0;
                self.lane = 1;
            }

            activeCtrl = null;
        }
        else if(isSwitchingLanes()) {
            move(dt, getSwitchDirection());
            if(hasReachedLane()){
                tShip.position.x = (destLane - 1) * laneWidth;
                self.lane = destLane;
                bankPct = 0;
            }
        }

        if(bankPct != 0) {
            var sign = bankPct && bankPct / Math.abs(bankPct);
            bankPct += bankRate * 2 * dt * sign;

            var newSign = bankPct && bankPct / Math.abs(bankPct);
            if(newSign !== sign){
                bankPct = 0;
            }
        }

        var collectOffset = 5,
            collectLane = getLaneFromPos();
        if(Warp.warpField && Warp.warpField[Warp.sliceIndex + collectOffset]){
            Warp.warpField[Warp.sliceIndex + collectOffset].gems.forEach((gem, lane) => {
                if(gem === 1 && lane === collectLane){
                    self.score++;
                    Warp.warpField[Warp.sliceIndex + collectOffset].gems[lane] = 2;
                }
            });
        }

        MScheduler.draw((dt, et) => {
            //Draw Ship
            MEasel.context.fillStyle = '#f00';
            tShip.rotation.z = bankPct * bankAngle;
            tShip.rotation.y = bankPct * bankAngle / 6;
            tShip.rotation.x = - Math.PI / 9 - Math.abs(bankPct * bankAngle) / 3;
            MCamera.render(Geometry.meshes.Ship, tShip, MM.vec3(255, 0, 0));
            //MCamera.drawShape(Shapes.Triangle, pos, shipWidth, 10, bankAngle);

            //Draw Shadow
            MEasel.context.fillStyle = 'rgba(0,0,0,.25)';
            //MCamera.drawShape(Shapes.Triangle, MM.vec3(tShip.position.x, 0, tShip.position.z), shipWidth * Math.cos(bankAngle), 10, 0);

            //var transform = new Geometry.Transform();
            for(var i = 0; i < 1; i++){
                transforms[i].rotation = MM.vec3(et / 1000);
                //MCamera.render(Geometry.meshes.Cube, transform, "#f0f");
            }

            transforms[0].position.x = -1;
            transforms[0].scale = MM.vec3(2);
            //MCamera.render(Geometry.meshes.Cube, transforms[0], MM.vec3(255, 0, 255));

        }, 10);
    });
}]);