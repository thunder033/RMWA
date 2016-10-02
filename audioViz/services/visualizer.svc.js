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
        var lastFrameAvg = 0,
            frameAvg = 0;
        //The maximum range of values with valid data present in the clip
        var dataLimit = 0,
            angle = 0;

        //pulse values
        var pulses = new PriorityQueue();

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
            effects: [],
            waveform: {},
            velocity: 0
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

        function analyzeWaveform(waveform){
            var peakMax = -Number.MAX_VALUE,
                troughMin = Number.MAX_VALUE,
                peakDistance = 0;

            //Find the peek value of the wave
            var i = 0;
            while(waveform[i] > peakMax){
                peakMax = waveform[i++];
            }

            while(waveform[++i] < peakMax || troughMin >= peakMax){
                peakDistance++;
                if(waveform[i] < troughMin){
                    troughMin = waveform[i];
                }

                if(i > waveform.length){
                    break;
                }
            }

            // return {
            //     peak: peakMax,
            //     peakDistance: i,
            //     trough: troughMin,
            //     period: peakDistance / SampleCount * 2
            // }

            visualizer.waveform.peak = peakMax;
            visualizer.waveform.peakDistance = peakDistance;
            visualizer.waveform.trough = troughMin;
            visualizer.waveform.period = peakDistance / SampleCount * 2
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

        function drawPulses(ctx, canvas, origin){
            //PULSES
            //Derive new velocity value from the period the waveform
            var vel = (1 / visualizer.waveform.period) / 20000;

            //If the new velocity is greater than current, generate a new pulse
            if(vel > visualizer.velocity){
                var energy = Math.min((visualizer.waveform.peak - visualizer.waveform.trough) / 10, 1);
                pulses.enqueue(0, {pos: 0, energy: energy});
            }

            //Either keep the new, higher velocity, or decay the existing velocity
            visualizer.velocity = vel > visualizer.velocity ? vel : visualizer.velocity * .97;

            //Create a gradient that will show the pulses
            var gradient2 = ctx.createRadialGradient(origin.x, origin.y, lastFrameAvg / 10, origin.x, origin.y, canvas.width / 2);

            //Add stops for each pulse
            var it = pulses.getIterator(), pulse;
            while(!it.isEnd()){
                pulse = it.next();
                pulse.pos += .008;

                var stopPos = Math.min(pulse.pos, 1),
                    stopEnd = Math.min(pulse.pos + .05, 1),
                    //I'm sure there's a name for this, but this math makes the opacity fall off after reaching a stop value of .5
                    a = stopPos > .5 ? (1 - (stopPos - .5) * 2) : 1,
                    opacity = a * a * pulse.energy;
                gradient2.addColorStop(stopPos, 'rgba(255,255,255,' + opacity + ')');
                gradient2.addColorStop(stopEnd, 'rgba(255,255,255,0)');
            }

            //Remove pulses that are outside the cirlce
            while(pulses.peek() && pulses.peek().pos > 1){
                pulses.dequeue();
            }

            //Draw everything
            ctx.fillStyle = gradient2;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.arc(origin.x, origin.y, canvas.width / 2, 0, 2 * Math.PI);
            ctx.fill();
        }

        function drawArcSet(ctx, data, start, end, stroke, fill, interval){
            interval = interval || 1;

            //The length of each arc
            var arcLength = (4 * Math.PI) / dataLimit,
                canvas = ctx.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2};

            //ctx.fillStyle = "#55aaff";
            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.beginPath();
            // loop through the data and draw!
            for (var i = start; i < end; i += interval) {

                if(data[i] > 0){
                    ctx.moveTo(origin.x, origin.y);
                    //Fudge the radius of the arcs based on the overall average of the previous range to the whole set of arcs is fuller
                    var r = (canvas.width / 2) * ((data[i] + lastFrameAvg) / 512);
                    ctx.arc(origin.x, origin.y, r, angle + i * arcLength, angle + (i + 1) * arcLength);
                    ctx.closePath();
                }

                //Add the current value to the average
                frameAvg += data[i] / dataLimit;
            }

            ctx.fill();
            //ctx.stroke();
        }

        function drawArcs(ctx, data){
            var canvas = ctx.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2};

            drawPulses(ctx, canvas, origin);

            //keep track of how many indices in the data array actually have values
            //This prevents a large slice of the visualizer from being empty early in the song or for songs that smaller range of data
            dataLimit = getDataLimit(data, dataLimit);

            frameAvg = 0;
            drawArcSet(ctx, data, 0, dataLimit / 2, '#fc0', 'rgba(210,10,10,.75)', 2);
            drawArcSet(ctx, data, 1, dataLimit / 2 + 1, '#fc0', 'rgba(120,10,10,.65)', 2);
            drawArcSet(ctx, data, dataLimit / 2, dataLimit, "rgba(0, 0, 50, .5)", "rgba(230, 120, 120, .5)", 2);
            drawArcSet(ctx, data, dataLimit / 2 + 1, dataLimit - 1, "rgba(0, 0, 50, .5)", "rgba(255, 170, 170, .5)", 2);

            var gradient = ctx.createRadialGradient(origin.x, origin.y, frameAvg / 10, origin.x, origin.y, frameAvg);
            gradient.addColorStop(0, "#fff");
            gradient.addColorStop(1, "rgba(255,255,255,0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.arc(origin.x, origin.y, frameAvg, 0, 2 * Math.PI);
            ctx.fill();

            //Make things spin
            angle += visualizer.velocity;

            //store the average for the next frame
            lastFrameAvg = frameAvg;
        }

        function update() {
            var analyzerNode = AudioPlayerService.getAnalyzerNode();

            if (!analyzerNode) {
                return;
            }

            var data = new Uint8Array(SampleCount / 2),
                waveform = new Uint8Array(SampleCount / 2);
            // populate the array with the frequency data
            analyzerNode.getByteFrequencyData(data);

            // OR
            analyzerNode.getByteTimeDomainData(waveform); // waveform data

            analyzeWaveform(waveform);

            //Draw visualization
            Scheduler.draw(()=> drawArcs(EaselService.context, data), 100);

            //Apply pixel manipulation effects
            Scheduler.postProcess(()=>manipulatePixels(EaselService.context));
        }

        return visualizer;
});