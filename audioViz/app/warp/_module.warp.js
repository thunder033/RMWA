/**
 * Created by gjrwcs on 10/25/2016.
 */
"use strict";
angular.module('pulsar-warp', [])
    .service('Warp', function (MConcurrentOperation, AudioClipService, AudioData, AutoPlay, MediaStates, SampleCount, MScheduler, MEasel, AudioPlayerService, WaveformAnalyzer, MalletMath) {
        var MM = MalletMath;
        //Create a web worker with the analysis script
        var fieldGenerator = MConcurrentOperation.create('assets/js/workers/generateAudioField.js');

        var audioField = [],
            barQueue = [],
            barsVisible = 45,
            velocity = 0,
            timeStep = 0;

        /**
         * Performs analysis to generate "audio field" and then begins play
         * @param clip
         */
        function getAudioField(clip) {
            //This function renders all of the PCM data for the entire clip into series of buffers
            //The result thousands of buckets of 1024 samples (~800 per minute of play w/ current config)
            AudioData.renderFrameBuffers(clip)
                .then(result => {
                    //this is the average duration of time for each buffer created
                    timeStep = (result.duration / result.frameBuffers.length) * 1000;
                    //Invoke the analysis in a separate thread (using a web worker)
                    return fieldGenerator.invoke({
                        sampleRate: result.sampleRate, //How many samples per second
                        frequencyBinCount: SampleCount, //The number of frequency bins
                        frameBuffers: result.frameBuffers //The actual array of frame buffers
                    })
                }).then(result => {
                audioField = result.audioField; //The "level" generated by the async web worker
                AudioPlayerService.registerPlayer(); //init the audio player service

                //Play the clip - this can take time to initialize
                AudioPlayerService.playClip(clip.id).then(()=>{
                    MScheduler.schedule(update); //when the clip actually begins playing start the level
                });

            });
        }

        /**
         * Initialize Game
         */
        this.init = () => {
            AudioClipService.getClipList() //wait for clips to load
                .then(AudioClipService.loadAudioClips)
                .then(null, null, function(clip){
                    if(clip.name == AutoPlay && clip.state == MediaStates.READY){
                        getAudioField(clip); //start the game with the default clip
                    }
                });
        };


        var elapsed = 0, //elapsed time since last bar was rendered
            barOffset = 0, //this value allows the bar to "flow" instead of "jump"

            frequencies = [], //the set of waveform frequencies to average to determine bar width/speed
            frequencySamples = 10, //how many waveform frequencies to average

            barIndex = 0; //where we are in the level

        /**
         * Get the average value of an array of numbers
         * @param arr
         * @returns {*}
         */
        function getAvg(arr) {
            return arr.reduce((avg, value) => avg + value / arr.length, 0);
        }

        function getLensAngle(){
            var focalLength = 5;
            return Math.atan(1 / focalLength);
        }

        /**
         * Draws a rectangle in the Z plane - derived from Hammer code
         * @param x
         * @param y
         * @param z
         * @param width
         * @param depth
         */
        function fillFlatRect(x, y, z, width, depth){
            //Don't draw things that are in front of the camera
            if(z <= 0){
                return;
            }

            var ctx = MEasel.context,
                cameraPos = MM.vec3(0, .2, 0), //position of the camera in 3d space
                viewport = MM.vec2(ctx.canvas.width, ctx.canvas.height),
                screenCenter = MM.vec2(viewport.x / 2, viewport.y / 2), //center of the viewport

                //position of the object relative to the camera
                //The Y position is inverted because screen space is reversed in Y
                relPosition = MM.vec3(x - cameraPos.x, -(y - cameraPos.y), z - cameraPos.z),
                lensAngle = getLensAngle(), //the viewing angle of the lens, large is more stuff visible

                nearFieldRadius = z * Math.tan(lensAngle), //the FOV radius at the close rect edge (smaller)
                farFieldRadius = (z + depth) * Math.tan(lensAngle); //the FOV radius at the far edge of the rect (larger)

            //Calculate the position of the object on the screen
            //Draw position of the near left corner
            var screenPosX = (relPosition.x / nearFieldRadius) * viewport.x + screenCenter.x,
                screenPosY = (relPosition.y / nearFieldRadius) * viewport.y + screenCenter.y,
                screenPos = MM.vec2(screenPosX, screenPosY);

            //Draw position of the far left corner
            var farEdgeOffsetX = ((relPosition.x / farFieldRadius) - (relPosition.x / nearFieldRadius)) * viewport.x,
                farEdgeOffsetY = ((relPosition.y / farFieldRadius) - (relPosition.y / nearFieldRadius)) * viewport.y,
                farEdgeOffset = MM.vec2(farEdgeOffsetX, farEdgeOffsetY);

            //The widths of the near and far edges of the rectangle
            var nearEdgeWidth = (width / nearFieldRadius) * viewport.x,
                farEdgeWidth = (width / farFieldRadius) * viewport.x;

            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);
            ctx.beginPath();
            ctx.moveTo(0, 0); //front left point
            ctx.lineTo(farEdgeOffset.x, farEdgeOffset.y); //back left
            ctx.lineTo(farEdgeOffset.x + farEdgeWidth, farEdgeOffset.y); //back right
            ctx.lineTo(nearEdgeWidth, 0); //front right
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        /**
         * This is the main loop function for Warp
         * @param dt deltaTime
         */
        function update(dt) {

            var waveform = WaveformAnalyzer.getMetrics();
            //barsVisible = ~~(15 + waveform.period * 15);

            //advance through the level
            elapsed += dt;
            /**
             * This creates a sort of independent fixed update the ensures the level follows the song
             * Each bar the screen represents a fixed amount of time, and no matter how wide, can only
             * remain on screen for the duration for everything to stay in sync
             */
            while(elapsed > timeStep / 1000){
                elapsed -= timeStep;
                barIndex++;
                barOffset = 0; //reset the bar offset

                //remove the bar that just moved off screen
                if(barQueue.length > 0)
                {
                    barQueue.shift();
                }

                //Create a new bar
                while(barQueue.length < barsVisible){
                    //get the current waveform frequency and remove the oldest value
                    frequencies.push(((1 / waveform.period) / 10));
                    if(frequencies.length > frequencySamples){
                        frequencies.shift();
                    }

                    //add a new bar to the queue
                    barQueue.push({
                        speed: .7 + .3 * getAvg(frequencies) //this value is basically fudged to work well
                    });
                }
            }

            //Add a draw command for the frame
            MScheduler.draw(()=>{
                var ctx = MEasel.context,
                    barHeight = ctx.canvas.height / barsVisible,
                    barMargin = 10, //space between bars
                    barWidth = .45; //width of the bars

                //how fast the set of bars is moving across the screen
                velocity = (barHeight * barQueue[0].speed + barMargin) / timeStep;
                barOffset += velocity * dt;
                //make the first bar yellow
                ctx.fillStyle = '#ff0';
                var drawOffset = 200; //this spaces the bars correctly across the screen, 200 is based on how far above the plane the camera is
                for(var i = 0; i < barsVisible; i++){
                    var drawWidth = barWidth * audioField[barIndex + i];
                    fillFlatRect( - drawWidth / 2, 0, (drawOffset - barOffset) / 100, drawWidth, (barHeight * barQueue[i].speed) / 100);
                    drawOffset += barHeight * barQueue[i].speed + barMargin; //add the width the current bar (each bar has a different width)
                    ctx.fillStyle = '#fff';
                }
            });
        }

        /**
         * Debugging stuff
         */
        var imgData;
        function debugDraw() {
            MScheduler.postProcess(() => {
                var ctx = MEasel.context;

                if(!audioField.length)
                    return;

                var start = 0,
                    rows = 750;
                // i) get all of the rgba pixel data of the canvas by grabbing the imageData Object
                imgData = imgData || ctx.getImageData(100, 100, 512, rows);

                var data = imgData.data,
                    length = data.length;

                //Renders FFT data
                // for(var i = start; i < audioField.length; i += 5){
                //     for(var f = 0; f < audioField[i].length; f++){
                //         var value = 255 * audioField[i][f] * 10;
                //         var row = (i - start) * 512 * 4 / 5;
                //         data[row + f * 4] = value;
                //         data[row + f * 4 + 1] = value;
                //         data[row + f * 4 + 2] = value;
                //         data[row + f * 4 + 3] = 255;
                //     }
                //
                //     if(i > start + rows * 5){
                //         break;
                //     }
                // }

                //Renders loudness Data
                for(var i = start; i < audioField.length; i += 5){
                    for(var f = 0; f < 512; f++){
                        var value = 255 * audioField[i];
                        var row = (i - start) * 512 * 4 / 5;
                        data[row + f * 4] = value;
                        data[row + f * 4 + 1] = value;
                        data[row + f * 4 + 2] = value;
                        data[row + f * 4 + 3] = 255;
                    }

                    if(i > start + rows * 5){
                        break;
                    }
                }

                ctx.putImageData(imgData, 200, 100);
            });
        }

        //MScheduler.schedule(debugDraw);

    });