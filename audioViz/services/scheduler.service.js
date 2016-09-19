/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('MaxFrameRate', 60)
    .service("Scheduler", function(MaxFrameRate){
        var updateOperations = [],
            drawCommands = [],

            timestep = 1000 / MaxFrameRate,
            fps = MaxFrameRate,
            lastFPSUpdate = 0,
            framesThisSecond = 0,

            startTime = 0,
            deltaTime = 0,
            elapsedTime = 0,
            lastFrameTime = 0;

        function update(deltaTime, elapsedTime) {
            //reset draw commands to prevent duplicate frames being rendered
            drawCommands.length = 0;

            for(var i = 0; i < updateOperations.length; i++){
                updateOperations[i].call(null, deltaTime, elapsedTime);
            }
        }

        function draw(deltaTime, elapsedTime) {
            for(var i = 0; i < drawCommands.length; i++){
                drawCommands[i].command.call(null, deltaTime, elapsedTime);
            }
        }

        function updateFPS(elapsedTime) {
            framesThisSecond++;
            if(elapsedTime > lastFPSUpdate + 1000){
                var weightFactor = 0.25;
                fps = weightFactor * framesThisSecond + (1 - weightFactor) * fps;
                lastFPSUpdate = elapsedTime;
                framesThisSecond = 0;
            }
        }

        /**
         * Derived From
         * http://www.isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
         */
        function mainLoop(){
            var frameTime =  (new Date()).getTime();
            deltaTime += frameTime - lastFrameTime;
            lastFrameTime = frameTime;
            elapsedTime = frameTime - startTime;

            updateFPS(elapsedTime);

            var updateSteps = 0;
            while(deltaTime > timestep){
                update(timestep, elapsedTime);
                deltaTime -= timestep;

                if(++updateSteps > 240){
                    console.warn("Update Loop Exceeded 240 Calls");
                    break;
                }
            }

            draw(deltaTime, elapsedTime);
            requestAnimationFrame(mainLoop);
        }

        function getDrawIndex(zIndex){
            var index = drawCommands.length;
            //Find the next index to draw at
            while(index > 0 && drawCommands[index - 1].zIndex > zIndex){
                index--;
            }
            return index;
        }

        return {
            get FPS(){
                return fps;
            },
            startMainLoop() {
                startTime = (new Date()).getTime();
                lastFrameTime = (new Date()).getTime();
                requestAnimationFrame(mainLoop);
            },

            schedule(operation) {
                if(operation instanceof Function){
                    updateOperations.push(operation);
                }
                else {
                    throw new TypeError("Operation must be a function");
                }
            },

            draw(operation, zIndex) {
                if(operation instanceof Function){
                    zIndex = zIndex || 0;
                    var index  = getDrawIndex(zIndex);
                    drawCommands.splice(index, 0, {command: operation, zIndex: zIndex});
                }
                else {
                    throw new TypeError("Operation must be a function");
                }
            }
        }
});