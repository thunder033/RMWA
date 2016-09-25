/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
app.constant('Effects', Object.freeze({
        NOISE: 'NOISE',
        TINT_RED: 'TINT_RED',
        INVERT: 'INVERT',
        LINES: 'LINES',
        DESATURATE: 'DESATURATE'
    }))
    .service('Visualizer', function(Scheduler, AudioPlayerService, EaselService, SampleCount, Effects){

        // HELPER
        function makeColor(red, green, blue, alpha){
            return 'rgba('+red+','+green+','+blue+', '+alpha+')';
        }

        //The average of the frequency values from the last frame
        var lastFrameAvg = 0;
        //The maximum range of values with valid data present in the clip
        var dataLimit = 0,
            angle = 0;

        var visualizer = {
            init(){
                Scheduler.schedule(update);
                AudioPlayerService.addPlayEventListener(visualizer.reset);
            },
            reset(){
                console.log(dataLimit);
                dataLimit = 0;
            },
            //This value is data bound to the slider
            //See templates/control-panel.html
            maxRadius: 200,
            brightness: 1,
            effects: []
        };

        function getActiveEffects() {
            var effects = {};
            Object.keys(Effects).forEach(effect=>{
                //using explicit boolean values here greatly improves performance
                effects[effect] = visualizer.effects.indexOf(effect) > -1;
            });
            return effects;
        }

        function manipulatePixels(ctx){
            if(!visualizer.effects.length){
                return;
            }

            // i) get all of the rgba pixel data of the canvas by grabbing the imageData Object
            var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

            var data = imgData.data,
                length = data.length,
                width = imgData.width,
                activeEffects = getActiveEffects();

            for(var i = 0; i < length; i += 4){
                //explicit checks for true are faster
                if(activeEffects[Effects.TINT_RED] === true){
                    data[i] += 100;
                }

                if(activeEffects[Effects.LINES] === true){
                    var row = ~~(i/4/width);
                    if(row % 50 == 0){
                        data[i] = data[i + 1] = data[i + 2] = 255;

                        var nextRow = width * 4;
                        data[i + nextRow] = data[i + nextRow + 1] = data[i + nextRow + 2] = 255;
                    }
                }

                if(activeEffects[Effects.NOISE] === true && Math.random() < .1){
                    data[i] = data[i + 1] = data[i + 2] = 128;
                }

                if(activeEffects[Effects.INVERT] === true){
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }

                if(activeEffects[Effects.DESATURATE] === true){
                    //http://stackoverflow.com/questions/13348129/using-native-javascript-to-desaturate-a-colour
                    var grey = (data[i] * 0.3086 + data[i + 1] * 0.6094 + data[i + 2] * 0.0820);
                    data[i] = data[i + 1] = data[i + 2] = grey;
                }
            }

            ctx.putImageData(imgData, 0, 0);
        }

        function getDataLimit(data, start){
            var limit = start || 0;
            for(var i = start; i < data.length; i++){
                if(data[i] > 0 && i > limit){
                    limit = i;
                }
            }
            return limit - limit % 2;
        }

        function drawArcs(ctx, data){
            var canvas = ctx.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2};

            //keep track of how many indices in the data array actually have values
            //This prevents a large slice of the visualizer from being empty early in the song or for songs that smaller range of data
            dataLimit = getDataLimit(data, dataLimit);

            //The length of each arc
            var arcLength = (4 * Math.PI) / dataLimit;

            var frameAvg = 0;
            ctx.fillStyle = "#55aaff";
            ctx.strokeStyle = "#fc0";
            ctx.beginPath();
            // loop through the data and draw!
            for (var i = 0; i < dataLimit / 2; i++) {

                if(data[i] > 0){
                    ctx.moveTo(origin.x, origin.y);
                    //Fudge the radius of the arcs based on the overall average of the previous range to the whole set of arcs is fuller
                    ctx.arc(origin.x, origin.y, (canvas.width / 2) * ((data[i] + lastFrameAvg) / 512), angle + i * arcLength, angle + (i + 1) * arcLength);
                    ctx.closePath();
                }

                //Add the current value to the average
                frameAvg += data[i] / dataLimit;
            }

            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "rgba(100, 50, 200, .5)";
            ctx.strokeStyle = "rgba(0, 0, 50, .5)";
            ctx.beginPath();

            for (i; i < dataLimit; i++) {

                if(data[i] > 0){
                    ctx.moveTo(origin.x, origin.y);
                    //Fudge the radius of the arcs based on the overall average of the previous range to the whole set of arcs is fuller
                    ctx.arc(origin.x, origin.y, (canvas.width / 2) * ((data[i] + lastFrameAvg) / 512), -angle + i * arcLength, -angle + (i + 1) * arcLength);
                    ctx.closePath();
                }

                //Add the current value to the average
                frameAvg += data[i] / dataLimit;
            }

            ctx.fill();
            ctx.stroke();

            var gradient = ctx.createRadialGradient(origin.x, origin.y, frameAvg / 10, origin.x, origin.y, frameAvg);
            gradient.addColorStop(0, "#000");
            gradient.addColorStop(1, "rgba(0,0,0,0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.arc(origin.x, origin.y, frameAvg, 0, 2 * Math.PI);
            ctx.fill();

            angle += frameAvg / 10000;

            //store the average for the next frame
            lastFrameAvg = frameAvg;
        }

        function update() {
            var analyzerNode = AudioPlayerService.getAnalyzerNode();

            if (!analyzerNode) {
                return;
            }

            var data = new Uint8Array(SampleCount / 2);
            // populate the array with the frequency data
            analyzerNode.getByteFrequencyData(data);

            // OR
            //analyzerNode.getByteTimeDomainData(data); // waveform data

            //Draw visualization
            Scheduler.draw(()=> drawArcs(EaselService.context, data), 100);

            //Apply pixel manipulation effects
            Scheduler.postProcess(()=>manipulatePixels(EaselService.context));
        }

        return visualizer;
});