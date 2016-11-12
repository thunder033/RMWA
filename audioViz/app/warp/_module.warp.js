/**
 * Created by gjrwcs on 10/25/2016.
 */
"use strict";
angular.module('pulsar.warp', [])
    .service('WarpFieldCache', ['warp.WarpField', function(WarpField){

        function getObjectSignature(obj){
            return Object.keys(obj).join();
        }

        this.store = (clip, field) => {
            localStorage.setItem(clip.name, JSON.stringify(field));
        };

        this.retrieve = (clip) => {
            var warpField = JSON.parse(localStorage.getItem(clip.name)),
                signature = getObjectSignature(warpField || {});

            if(signature !== getObjectSignature(new WarpField())){
                localStorage.setItem(clip.name, '');
                return null;
            }

            return warpField;
        }
    }])
    .constant('Shapes', Object.freeze({
        Triangle: 'Triangle',
        Quadrilateral: 'Quadrilateral'
    }))
    .factory('warp.Bar', ['MalletMath', function(MM){
        return {
            //dimensions of the flanking bars
            scale: MM.vec3(1.5, 1, .9),
            margin: .1
        }
    }])
    .service('WarpFieldDraw', ['MScheduler', 'warp.Level', 'MalletMath', 'warp.State', 'MCamera', 'Geometry', 'warp.Bar', 'MEasel', '$timeout', function(MScheduler, WarpLevel, MM, WarpState, MCamera, Geometry, Bar, MEasel, $timeout){
        var velocity = 0,
            sliceOffset = 3, //how many slice to draw behind the ship (that have already passed)
            meshes = Geometry.meshes,
            Transform = Geometry.Transform;

        var mLaneWidth = .20, //width of each lane
            mLanePadding = .01, //padding on edge of each lane

        tLane = new Transform();
        tLane.scale.x = mLaneWidth - mLanePadding;
        tLane.scale.z = 60;
        tLane.position.z = -37;
        tLane.position.y = -.1;
        tLane.origin.z = -.5;

        var tZero = new Transform();
        tZero.scale.x = mLaneWidth * 3;
        tZero.position = MM.vec3(0, -.1, 6);

        var gems = new Array(WarpLevel.barsVisible);
        for(var g = 0; g < gems.length; g++){
            gems[g] = new Transform();
            //gems[g].position.y = -.5;
            gems[g].rotation.y = Math.PI / 4;
            gems[g].rotation.x = Math.PI / 4;
            gems[g].scale = MM.vec3(.15);
        }

        var tBar = new Transform();
        tBar.origin.x = -1;
        tBar.origin.z = 1;

        function getStartOffset(barBuffer){
            var startOffset = 6;
            for(var i = 0; i < sliceOffset; i++){
                startOffset += barBuffer[i].speed * Bar.scale.z + Bar.margin;
            }

            return startOffset;
        }

        function draw(dt, tt){
            var zRot = - Math.PI / 8; //rotation of loudness bars on the edges

            WarpLevel.barOffset += velocity * dt;
            //make the first bar yellow
            //ctx.fillStyle = '#ff0';
            var color = MM.vec3(100,255,255);

            var drawOffset = getStartOffset(WarpLevel.barQueue); //this spaces the bars correctly across the screen, based on how far above the plane the camera is
            for(var i = 0; i < WarpLevel.barsVisible; i++){
                if(i + 10 > WarpLevel.barsVisible){
                    var sliceValue = 1 - (WarpLevel.barsVisible - i) / 10;
                    color = MM.vec3(100 + sliceValue * 110, 255 - sliceValue * 45, 255 - sliceValue * 45);
                }

                var depth = Bar.scale.z * WarpLevel.barQueue[i].speed,
                    zOffset = drawOffset - WarpLevel.barOffset;

                tBar.scale.x = Bar.scale.x * WarpLevel.getLoudness(i);
                tBar.scale.z = depth;

                tBar.position = MM.vec3(-mLaneWidth, 0, zOffset);
                tBar.rotation.z = (-Math.PI) - zRot;
                MCamera.render(meshes.XZQuad, tBar, color);

                tBar.position = MM.vec3(mLaneWidth, 0, zOffset);
                tBar.rotation.z = zRot;
                MCamera.render(meshes.XZQuad, tBar, color);

                var sliceGems = (WarpLevel.warpField[WarpLevel.sliceIndex + i] || {}).gems || [];
                gems[i].scale = MM.vec3(0);
                for(var l = 0; l < 3; l++){
                    if(sliceGems[l] === 1 && (WarpLevel.sliceIndex +i) % 2 === 0){
                        gems[i].scale = MM.vec3(.15);
                        gems[i].rotation.y = tt / 1000;
                        gems[i].position = MM.vec3((l - 1) * mLaneWidth * 3, -.5, zOffset);
                    }
                }

                drawOffset -= depth + Bar.margin ; //add the width the current bar (each bar has a different width)
            }

            tLane.position.x = -mLaneWidth;
            var grey = MM.vec3(225,225,225);
            MCamera.render(meshes.XZQuad, tLane, grey);
            tLane.position.x = 0;
            MCamera.render(meshes.XZQuad, tLane, grey);
            tLane.position.x = mLaneWidth;
            MCamera.render(meshes.XZQuad, tLane, grey);

            //MCamera.render(meshes.XZQuad, tZero, MM.vec3(255,0,0));

            MCamera.present(); //Draw the background

            var green = MM.vec3(0,225,40);
            MCamera.render(meshes.Cube, gems, green);
            MCamera.present(); //Draw the background
        }

        this.init = () => {
            $timeout(()=>MEasel.context.canvas.style.backgroundImage = 'radial-gradient(#b2b2b2, #000)');

            MScheduler.schedule(()=>{
                if(WarpState.current !== WarpState.Playing) {
                    return;
                }

                MScheduler.draw(draw, 9);
            });
        }

    }]);
