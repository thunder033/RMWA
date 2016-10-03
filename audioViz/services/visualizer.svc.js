/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
app.constant('Effects', Object.freeze({
        NOISE: 'NOISE',
        INVERT: 'INVERT',
        DESATURATE: 'DESATURATE'
    }))
    .constant('MaxFrequency', 21050)
    .constant('FrequencyRanges', [
        0, 60, 250, 2000, 6000, 21050
    ])
    .service('Visualizer', function (Scheduler, AudioPlayerService, EaselService, SampleCount, Effects, FrequencyRanges, MaxFrequency) {

        /**
         * Generate and RGBA color string from the provided values
         * @param red
         * @param green
         * @param blue
         * @param alpha
         * @returns {string}
         */
        function rgba(red, green, blue, alpha) {
            return 'rgba(' + red + ',' + green + ',' + blue + ', ' + alpha + ')';
        }

        /**
         * Generate an HSLA color string from the provided values
         * @param hue
         * @param saturation
         * @param lightness
         * @param alpha
         * @returns {string}
         */
        function hsla(hue, saturation, lightness, alpha) {
            return `hsla(${hue},${saturation},${lightness},${alpha})`;
        }

        //The average of the frequency values from the last frame
        var lastFrameAvg = 0,
            frameAvg = 0;
        //The maximum range of values with valid data present in the clip
        var dataLimit = 0,
            angle = 0;

        //pulse values - these don't strictly need priority queues, but they work
        var radialPulses = new PriorityQueue(), //pulses generated from waveform - drawn as circles
            linearPulses = []; //pulses generated from frequency - drawn as bulges across center

        var visualizer = {
            init(){
                Scheduler.schedule(update);
                AudioPlayerService.addPlayEventListener(visualizer.reset);
            },
            reset(){
                dataLimit = 0;
            },
            effects: [],
            waveform: {},
            velocity: 0,
            hue: 0,
            noiseThreshold: .1,
            frequencyMaxes: new Uint8Array(FrequencyRanges.length),
            frequencyAverages: new Array(FrequencyRanges.length)
        };

        visualizer.frequencyAverages.fill(0);

        /**
         * Returns a map of the active pixel effects, based on the visualizer effects array
         * @returns {{}}
         */
        function getActiveEffects() {
            var effects = {};
            Object.keys(Effects).forEach(effect=> {
                //using explicit boolean values here greatly improves performance
                effects[effect] = visualizer.effects.indexOf(effect) > -1;
            });
            return effects;
        }

        /**
         * Performs pixel-level manipulation based on the active visualizer effects
         * @param ctx
         */
        function manipulatePixels(ctx) {
            //if there's no effects active, bail out
            if (!visualizer.effects.length) {
                return;
            }

            // i) get all of the rgba pixel data of the canvas by grabbing the imageData Object
            var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

            var data = imgData.data,
                length = data.length,
                noiseThreshold = parseFloat(visualizer.noiseThreshold),
                activeEffects = getActiveEffects();

            //iterate over each pixel, applying active effects;
            for (var i = 0; i < length; i += 4) {

                if (activeEffects[Effects.NOISE] === true && Math.random() < noiseThreshold) {
                    data[i] = data[i + 1] = data[i + 2] = 255 * Math.random();
                }

                if (activeEffects[Effects.INVERT] === true) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }

                if (activeEffects[Effects.DESATURATE] === true) {
                    //StackOverflow user Shmiddty
                    //http://stackoverflow.com/questions/13348129/using-native-javascript-to-desaturate-a-colour
                    var grey = (data[i] * 0.3086 + data[i + 1] * 0.6094 + data[i + 2] * 0.0820);
                    data[i] = data[i + 1] = data[i + 2] = grey;
                }
            }

            ctx.putImageData(imgData, 0, 0);
        }

        /**
         * Calculate the peak, trough, and period of the waveform
         * @param {Array} waveform
         * @param {Object} outResults
         */
        function analyzeWaveform(waveform, outResults) {
            var peakMax = -Number.MAX_VALUE,
                troughMin = Number.MAX_VALUE,
                peakDistance = 0;

            //Find the peak value of the wave and position of the first peak
            var i = 0;
            while (waveform[i] > peakMax) {
                peakMax = waveform[i++];
            }

            //Find the trough and the period
            while (waveform[++i] < peakMax || troughMin >= peakMax) {
                peakDistance++;
                if (waveform[i] < troughMin) {
                    troughMin = waveform[i];
                }

                if (i > waveform.length) {
                    break;
                }
            }

            //Set the values on the object to maintain object references
            outResults.peak = peakMax;
            outResults.peakDistance = peakDistance;
            outResults.trough = troughMin;
            outResults.amplitude = peakMax - troughMin;
            outResults.period = peakDistance / SampleCount * 2
        }

        /**
         * Find the highest index in the data set that has significant values
         * @param data
         * @param start
         * @returns {number}
         */
        function getDataLimit(data, start) {
            var limit = start || 0;
            for (var i = start; i < data.length; i++) {
                if (data[i] > 0 && i > limit) {
                    limit = i;
                }
            }
            //make the limit an even number to avoid weird overlaps in the arcs
            return limit - (limit % 2);
        }

        /**
         * Draw radial pulses into the lower-right quarter of the the provided context
         * @param ctx the context to draw on
         * @param origin where to start drawing from
         * @param maxRadius the max radius of the pulses
         */
        function drawQuarterRadialPulses(ctx, origin, maxRadius) {
            //PULSES
            //Derive new velocity value from the period the waveform
            var vel = (1 / visualizer.waveform.period) / 20000;

            //If the new velocity is greater than current, generate a new pulse
            if (vel > visualizer.velocity) {
                var energy = Math.min((visualizer.waveform.amplitude) / 10, 1);
                radialPulses.enqueue(0, {pos: 0, energy: energy});
            }

            //Either keep the new, higher velocity, or decay the existing velocity
            var decayRate = 0.03;
            visualizer.velocity = vel > visualizer.velocity ? vel : visualizer.velocity * (1 - decayRate);

            //Create a gradient that will show the pulses
            var gradient2 = ctx.createRadialGradient(origin.x, origin.y, lastFrameAvg / 10, origin.x, origin.y, maxRadius);

            //Add stops for each pulse
            var it = radialPulses.getIterator(), pulse;
            while (!it.isEnd()) {
                pulse = it.next();
                pulse.pos += .008;

                var stopPos = Math.min(pulse.pos, 1),
                    stopEnd = Math.min(pulse.pos + .05, 1),
                //I'm sure there's a name for this, but this math makes the opacity fall off after reaching a stop value of .5
                    a = stopPos > .5 ? (1 - (stopPos - .5) * 2) : 1,
                    opacity = a * a * pulse.energy;

                gradient2.addColorStop(stopPos, rgba(255, 255, 255, opacity));
                gradient2.addColorStop(stopEnd, rgba(255, 255, 255, 0));
            }

            //Remove pulses that are outside the cirlce
            while (radialPulses.peek() && radialPulses.peek().pos > 1) {
                radialPulses.dequeue();
            }

            //Draw a quarter of of the pulses so we can copy and paste
            ctx.fillStyle = gradient2;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.arc(origin.x, origin.y, maxRadius, 0, Math.PI / 2);
            ctx.fill();
        }

        /**
         * Get the index of the range the frequency falls into
         * @param frequency
         * @returns {number}
         */
        function getRangeIndex(frequency) {
            var index = 0;
            while (frequency > FrequencyRanges[index]) {
                index++;

                if (index >= FrequencyRanges.length) {
                    return index;
                }
            }
            return index;
        }

        /**
         * Draw a subset of the arcs for the frequency pinwheel
         * @param ctx
         * @param data frequency data to draw with
         * @param start the index to start drawing from
         * @param end the index to stop drawing at
         * @param fill the color to fill the arcs
         * @param interval how many data values to increment each iteration
         */
        function drawArcSet(ctx, data, start, end, fill, interval) {
            interval = interval || 1;

            //The length of each arc
            var arcLength = (4 * Math.PI) / dataLimit,
                canvas = ctx.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2};

            ctx.fillStyle = fill;
            ctx.beginPath();

            var frequencyInterval = MaxFrequency / data.length;

            //Pre-render a single arc so it can be transformed fro each section of the pinwheel
            var cacheCtx = EaselService.getContext('arcRender');
            cacheCtx.clearRect(0, 0, cacheCtx.canvas.width, cacheCtx.canvas.height);
            cacheCtx.canvas.height = Math.sin(arcLength) * canvas.height;
            cacheCtx.fillStyle = fill;
            cacheCtx.beginPath();
            cacheCtx.moveTo(0, 0);
            cacheCtx.arc(0, 0, canvas.width / 2, 0, arcLength);
            cacheCtx.closePath();
            cacheCtx.fill();

            var arcBuffer = cacheCtx.canvas;
            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.rotate(angle + start * arcLength);
            // loop through the data and draw!
            for (var i = start; i < end; i += interval) {

                ctx.rotate(arcLength * interval);
                if (data[i] > 0) {
                    var maxLoudness = 256;
                    // //Fudge the radius of the arcs based on the overall average of the previous range to the whole set of arcs is fuller
                    var scale = ((data[i] + lastFrameAvg) / (maxLoudness * 2));
                    ctx.save();
                    ctx.scale(scale, scale);
                    ctx.drawImage(arcBuffer, 0, 0);
                    ctx.restore();

                    //Check if this value is a max in it's range
                    var frequency = frequencyInterval * i,
                        rangeIndex = getRangeIndex(frequency);

                    if (data[i] > visualizer.frequencyMaxes[rangeIndex]) {
                        visualizer.frequencyMaxes[rangeIndex] = data[i];
                    }
                }

                //Add the current value to the average
                frameAvg += data[i] / dataLimit;
            }

            ctx.restore();
        }

        /**
         * Draw a single linear pulse with the provided values
         * @param pulse
         * @param ctx
         * @param origin
         * @param width
         * @param height
         */
        function renderLinearPulse(pulse, ctx, origin, width, height) {
            var curveSize = width / 12, //how wide the bezier curve will be
                curveScale = width / 2 - curveSize, //how wide the overall path of the curve will be
                curveStartX = origin.x + curveSize + curveScale * pulse.position - curveSize; //where the curve will be this frame

            ctx.beginPath();
            ctx.moveTo(curveStartX, origin.y);

            //calculate how large the curve should be drawn
            //if the curve has a lower energy value it will start shrinking
            var weight = pulse.energy < .1 ? (pulse.energy) * 10 : 1;
            //the curve will grow out from the center instead snapping into existence
            var positionWeight = pulse.position < .15 ? pulse.position / .15 : 1;

            var cp1x = curveStartX + curveSize / 3;
            var cp2x = curveStartX + 2 * curveSize / 3;
            var cp1y = origin.y;
            var cp2y = origin.y + pulse.magnitude * weight * positionWeight + (Math.random() * height / 100);

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curveStartX + curveSize, origin.y);
            ctx.closePath();

            //Curves at the lower end of the frequency spectrum will be brighter
            var alpha = .5 + .5 * ((1 - pulse.frequencyRange) / FrequencyRanges.length);
            ctx.fillStyle = rgba(255, 255, 255, alpha);
            ctx.fill();
        }

        /**
         * Process and draw the linear pulses into lower right portion of the canvase
         * @param ctx
         * @param origin
         * @param width
         * @param height
         */
        function drawQuarterLinearPulses(ctx, origin, width, height) {
            //Linear Pulses
            var pulseDecayRate = .04, //The rate at which the energy pulses decay - how long they persist
                pulseThreshold = .0001, //The minimum energy value a pulse must have to be rendered
                pulseVelocity = 0.005 + visualizer.velocity / 1.7, //The speed at which pulses travel from center (0) to edge (1)
                nextPulses = [], //The pulses that will be rendered next frame
                largestPulses = new Array(FrequencyRanges.length); //Array of highest energy pulses for each frequency range

            largestPulses.fill(0);

            //Update and render each pulse
            linearPulses.forEach(function (pulse) {
                //Don't worry about pulses that are too weak to show up
                if (pulse.energy > pulseThreshold) {

                    //Update pulse properties
                    pulse.energy *= (1 - pulseDecayRate);
                    pulse.position += pulse.position > .85 ? pulseVelocity * ((1 - pulse.position) / .15) : pulseVelocity;

                    renderLinearPulse(pulse, ctx, origin, width, height);

                    //Record the pulse with the highest remaining energy
                    if (pulse.energy * pulse.volume > largestPulses[pulse.frequencyRange]) {
                        largestPulses[pulse.frequencyRange] = pulse.energy * pulse.volume;
                    }

                    //queue the pulse to rendered next round
                    nextPulses.push(pulse);
                }
            });

            //Create new pulses for each frequency range that has a high enough frequency
            for (var i = 0; i < FrequencyRanges.length; i++) {
                if (visualizer.frequencyMaxes[i] > largestPulses[i] * 2) {
                    nextPulses.push({
                        //where the pulse is positioned
                        position: 0,
                        //how much longer the pulse will be displayed
                        energy: 0.5 + (FrequencyRanges.length - i) * (0.5 / FrequencyRanges.length),
                        //how large the pulse appears - derived from frequency, loudness, waveform amplitude
                        magnitude: (FrequencyRanges.length - i) * (visualizer.waveform.amplitude / 20) * (visualizer.frequencyMaxes[i] / 40),
                        //how loud the pulse when it was generated
                        volume: visualizer.frequencyMaxes[i],
                        //frequency range the pulse was generated for
                        frequencyRange: i
                    })
                }
            }

            //Set the collection of pulses for the next frame
            linearPulses = nextPulses;
        }

        function drawRadialPulses(origin, ctx) {
            var quarterCtx = EaselService.getContext('quarterRender');
            drawQuarterRadialPulses(quarterCtx, {x: 0, y: 0}, ctx.canvas.width / 2);
            //mirror the image into the other quadrants
            EaselService.drawQuarterRender(ctx, quarterCtx.canvas, origin);
        }

        function drawLinearPulses(origin, ctx) {
            var quarterCtx = EaselService.getContext('quarterRender');
            EaselService.clearCanvas(quarterCtx);
            drawQuarterLinearPulses(quarterCtx, {x: 0, y: 0}, ctx.canvas.width, ctx.canvas.height);
            //mirror the image into the other quadrants
            EaselService.drawQuarterRender(ctx, quarterCtx.canvas, origin);
        }

        function drawFrequencyPinwheel(origin, ctx, data) {
            //keep track of how many indices in the data array actually have values
            //This prevents a large slice of the visualizer from being empty early in the song or for songs that smaller range of data
            dataLimit = getDataLimit(data, dataLimit);

            //reset frequency maxes and average volume of frame
            visualizer.frequencyMaxes.fill(0);
            frameAvg = 0;

            //EaselService.getContext('arcRender').canvas.height = ctx.canvas.height / 10;

            //Draw each set of arcs
            var darkBack = hsla(visualizer.hue, '84%', '25%', .65),
                lightBack = hsla(visualizer.hue, '90%', '43%', .75),
                darkFront = hsla(visualizer.hue, '70%', '70%', .5),
                lightFront = hsla(visualizer.hue, '55%', '78%', .5);

            drawArcSet(ctx, data, 0, dataLimit / 2, lightBack, 2); //skip every other
            drawArcSet(ctx, data, 1, dataLimit / 2 + 1, darkBack, 2); //offset by 1 and skip ever other arc
            drawArcSet(ctx, data, dataLimit / 2, dataLimit, darkFront, 2); //start at middle, skip every other
            drawArcSet(ctx, data, dataLimit / 2 + 1, dataLimit - 1, lightFront, 2); //start middle, offset by 1, skip every other

            //Draw circle in center of arcs
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
            AudioPlayerService.getConvolverNode();

            if (!analyzerNode) {
                return;
            }

            var data = new Uint8Array(SampleCount / 2),
                waveform = new Uint8Array(SampleCount / 2);

            // populate the array with the frequency data
            analyzerNode.getByteFrequencyData(data);
            analyzerNode.getByteTimeDomainData(waveform); // waveform data

            analyzeWaveform(waveform, visualizer.waveform);

            var canvas = EaselService.context.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2};

            //Draw visualization
            Scheduler.draw(()=> {
                EaselService.context.fillStyle = hsla(visualizer.hue, '90%', '10%', 1);
                EaselService.context.fillRect(0, 0, canvas.width, canvas.height);
            });
            Scheduler.draw(()=> drawRadialPulses(origin, EaselService.context), 99);
            Scheduler.draw(()=> drawFrequencyPinwheel(origin, EaselService.context, data), 100);
            Scheduler.draw(()=> drawLinearPulses(origin, EaselService.context), 101);

            //Apply pixel manipulation effects
            Scheduler.postProcess(()=>manipulatePixels(EaselService.context));
        }

        return visualizer;
    });