/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('MaxFrameRate', 60)
    .service("Scheduler", function(MaxFrameRate){
        var updateOperations = [],
            drawCommands = [],
            postDrawCommands = [],

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
            postDrawCommands.length = 0;

            for(var i = 0; i < updateOperations.length; i++){
                updateOperations[i].command.call(null, deltaTime, elapsedTime);
            }
        }

        function draw(deltaTime, elapsedTime) {
            for(var i = 0; i < drawCommands.length; i++){
                drawCommands[i].command.call(null, deltaTime, elapsedTime);
            }

            for(var j = 0; j < postDrawCommands.length; j++) {
                postDrawCommands[j].command.call(null, deltaTime, elapsedTime);
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

        function getPriorityIndex(priority, queue){
            var index = queue.length;
            //Find the next index to draw at
            while(index > 0 && queue[index - 1].priority > priority){
                index--;
            }
            return index;
        }

        function scheduleCommand(command, priority, queue) {
            if(command instanceof Function){
                priority = priority || 0;
                var index  = getPriorityIndex(priority, queue);
                queue.splice(index, 0, {command: command, priority: priority});
            }
            else {
                throw new TypeError("Operation must be a function");
            }
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

            schedule(operation, order) {
               scheduleCommand(operation, order, updateOperations);
            },

            draw(operation, zIndex) {
                scheduleCommand(operation, zIndex, drawCommands);
            },

            postProcess(operation, zIndex) {
                scheduleCommand(operation, zIndex, postDrawCommands);
            }
        }
});