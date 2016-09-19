/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
app.service('Visualizer', function(Scheduler, AudioPlayerService, EaselService, SAMPLE_COUNT){

    // HELPER
    function makeColor(red, green, blue, alpha){
        return 'rgba('+red+','+green+','+blue+', '+alpha+')';
    }

    //The average of the frequency values from the last frame
    var lastFrameAvg = 0;
    //The maximum range of values with valid data present in the clip
    var dataLimit = 0;

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
        maxRadius: 200
    };

    function manipulatePixels(ctx){
        // i) get all of the rgba pixel data of the canvas by grabbing the imageData Object
        var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

        var data = imgData.data,
            length = data.length,
            width = imgData.width;

        for(var i = 0; i < length; i += 4){
            data[i + 1] += 100;
        }

        ctx.putImageData(imgData, 0, 0);
    }

    function update() {
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

            //The length of each arc
            var arcLength = (2 * Math.PI) / dataLimit;

            var frameAvg = 0;
            // loop through the data and draw!
            for (var i = 0; i < data.length; i++) {

                if(data[i] > 0){
                    ctx.beginPath();
                    ctx.fillStyle = "#55aaff";
                    ctx.moveTo(origin.x, origin.y);
                    //Fudge the radius of the arcs based on the overall average of the previous range to the whole set of arcs is fuller
                    ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.width / 2) * ((data[i] + lastFrameAvg) / 512), i * arcLength, (i + 1) * arcLength);
                    ctx.closePath();
                    ctx.fill();

                    //keep track of how many indices in the data array actually have values
                    //This prevents a large slice of the visualizer from being empty early in the song or for songs that smaller range of data
                    if(i > dataLimit){
                        dataLimit = i;
                    }
                }

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

                //Add the current value to the average
                frameAvg += data[i] / data.length;
            }

            //store the average for the next frame
            lastFrameAvg = frameAvg;
        }, 100);

        Scheduler.postProcess(()=>manipulatePixels(EaselService.context));
    }

    return visualizer;
});