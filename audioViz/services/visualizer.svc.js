/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
app.service('Visualizer', function(Scheduler, AudioPlayerService, EaselService, SAMPLE_COUNT){

    // HELPER
    function makeColor(red, green, blue, alpha){
        return 'rgba('+red+','+green+','+blue+', '+alpha+')';
    }

    var visualizer = {
        init(){
            Scheduler.schedule(update);
        },
        maxRadius: 200
    };

    var lastFrameAvg = 0;
    var dataLimit = 0;

    function update(deltaTime, elapseTime) {
        var analyzerNode = AudioPlayerService.getAnalyzerNode();

        if (!analyzerNode) {
            return;
        }

        var data = new Uint8Array(SAMPLE_COUNT / 2);
        // populate the array with the frequency data
        analyzerNode.getByteFrequencyData(data);

        // OR
        //analyserNode.getByteTimeDomainData(data); // waveform data

        Scheduler.draw(()=> {
            var ctx = EaselService.context,
                canvas = ctx.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2};

            var barSpacing = 1;
            var barWidth = (canvas.width / data.length) - barSpacing;
            var barHeight = 100;

            var arcLength = (2 * Math.PI) / dataLimit;

            var frameAvg = 0;
            // loop through the data and draw!
            for (var i = 0; i < data.length; i++) {

                if(data[i] > 0){
                    ctx.beginPath();
                    ctx.fillStyle = "white";
                    ctx.moveTo(origin.x, origin.y);
                    ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.width / 2) * ((data[i] + lastFrameAvg) / 512), i * arcLength, (i + 1) * arcLength);
                    ctx.closePath();
                    ctx.fill();

                    if(i > dataLimit){
                        dataLimit = i;
                    }
                }


                // the higher the amplitude of the sample (bin) the taller the bar
                // remember we have to draw our bars left-to-right and top-down
                //ctx.fillRect(i * (barWidth + barSpacing), origin.y + 256 - data[i], barWidth, barHeight);

                //draw inverted bars
                //ctx.fillRect(canvas.width - (i + 1) * (barWidth + barSpacing), origin.y + 256 - data[i], barWidth, barHeight);

                //red-ishcircles
                var percent = data[i] / 255;
                var maxRadius = visualizer.maxRadius;
                var circleRadius = percent * maxRadius;

                ctx.beginPath();
                ctx.fillStyle = makeColor(255, 111, 111, .34 - percent / 3.0);
                ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.closePath();

                //blue-ishcircles,bigger,moretransparent
                ctx.beginPath();
                ctx.fillStyle = makeColor(0, 0, 255, .10 - percent / 10.0);
                ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius * 1.5, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.closePath();

                //yellow-ishcircles,smaller
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = makeColor(200, 200, 0, .5 - percent / 5.0);
                ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius * .50, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.closePath();
                ctx.restore();

                frameAvg += data[i] / data.length;
            }

            lastFrameAvg = frameAvg;
        }, 100);
    }

    return visualizer;
});