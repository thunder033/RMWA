/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('MaxFrameRate', 60)
    .service("Scheduler", function(MaxFrameRate){
        var updateOperations = new PriorityQueue(),
            drawCommands = new PriorityQueue(),
            postDrawCommands = new PriorityQueue(),

            timestep = 1000 / MaxFrameRate,
            fps = MaxFrameRate,
            lastFPSUpdate = 0,
            framesThisSecond = 0,
            
            startTime = 0,
            deltaTime = 0,
            elapsedTime = 0,
            lastFrameTime = 0;

        /**
         * Execute all update opeartions while preserving the queue
         * @param deltaTime
         * @param elapsedTime
         */
        function update(deltaTime, elapsedTime) {
            //reset draw commands to prevent duplicate frames being rendered
            drawCommands.clear();
            postDrawCommands.clear();

            var opsIterator = updateOperations.getIterator();
            while(!opsIterator.isEnd()){
                opsIterator.next().call(null, deltaTime, elapsedTime);
            }
        }

        /**
         * Execute all draw and post-draw commands, emptying each queue
         * @param deltaTime
         * @param elapsedTime
         */
        function draw(deltaTime, elapsedTime) {
            while(drawCommands.peek() != null){
                drawCommands.dequeue().call(null, deltaTime, elapsedTime);
            }

            while(postDrawCommands.peek() != null){
                postDrawCommands.dequeue().call(null, deltaTime, elapsedTime);
            }
        }

        /**
         * Update the FPS value
         * @param elapsedTime
         */
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

        function scheduleCommand(command, priority, queue) {
            if(command instanceof Function){
                priority = priority || 0;
                queue.enqueue(priority, command);
            }
            else {
                throw new TypeError("Operation must be a function");
            }
        }

        return {
            get FPS(){
                return fps;
            },
            /**
             * Initialize the main app loop
             */
            startMainLoop() {
                startTime = (new Date()).getTime();
                lastFrameTime = (new Date()).getTime();
                requestAnimationFrame(mainLoop);
            },

            /**
             * Schedule an update command to be executed each frame
             * @param operation
             * @param order
             */
            schedule(operation, order) {
               scheduleCommand(operation, order, updateOperations);
            },

            /**
             * Queue a draw opeartion to be executed once and discarded
             * @param operation
             * @param zIndex
             */
            draw(operation, zIndex) {
                scheduleCommand(operation, zIndex, drawCommands);
            },

            /**
             * Queue a post process operation to be executed one and discarded
             * @param operation
             * @param zIndex
             */
            postProcess(operation, zIndex) {
                scheduleCommand(operation, zIndex, postDrawCommands);
            }
        }
});