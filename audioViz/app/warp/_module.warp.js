/**
 * Created by gjrwcs on 10/25/2016.
 */
"use strict";
angular.module('pulsar-warp', [])
    .run(function (MConcurrentOperation, AudioClipService, AudioData, AutoPlay, MediaStates, SampleCount, MScheduler, MEasel, MColor) {
        var fieldGenerator = MConcurrentOperation.create('assets/js/workers/generateAudioField.js');

        var audioField = [];
        function getAudioField(clip){
            AudioData.renderFrameBuffers(clip)
                .then(result => fieldGenerator.invoke({
                    sampleRate: result.sampleRate,
                    frequencyBinCount: SampleCount,
                    frameBuffers: result.frameBuffers
                })).then(result => audioField = result.audioField);
        }

        AudioClipService.getClipList()
            .then(AudioClipService.loadAudioClips)
            .then(null, null, function(clip){
                if(clip.name == AutoPlay && clip.state == MediaStates.READY){
                    getAudioField(clip);
                }
            });

        MScheduler.schedule(()=>{
            MScheduler.draw(() => {
                var ctx = MEasel.context;

                if(!audioField.length)
                    return;

                var start = 2000;
                for(var i = start; i < audioField.length; i++){
                    for(var f = 0; f < audioField[i].length; f++){
                        var value = 255 * audioField[i][f] * 4000;
                        ctx.fillStyle = MColor.rgba(value, value, value, 1);
                        ctx.fillRect(200 + f, i - (start - 100), 1, 1);
                    }

                    if(i > start + 100){
                        break;
                    }
                }
            });
        });

    });