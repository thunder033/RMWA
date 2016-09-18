/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
app.service('Visualizer', function(Scheduler, AudioPlayerService, EaselService, SAMPLE_COUNT){

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
                origin = {x: 100, y: 200};

            var barWidth = 4;
            var barSpacing = 1;
            var barHeight = 100;

            // loop through the data and draw!
            for (var i = 0; i < data.length; i++) {
                ctx.fillStyle = 'rgba(0,255,0,0.6)';

                // the higher the amplitude of the sample (bin) the taller the bar
                // remember we have to draw our bars left-to-right and top-down
                ctx.fillRect(origin.x + i * (barWidth + barSpacing), origin.y + 256 - data[i], barWidth, barHeight);
            }
        }, 100);
    }

    return {
        init(){
            Scheduler.schedule(update);
        }
    };
});