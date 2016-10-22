/**
 * Created by gjr8050 on 10/19/2016.
 */
"use strict";
/**
 * Provides access to audio data
 */
app.service('AudioData', function (MScheduler, SampleCount, AudioPlayerService) {

    var waveformData = new Uint8Array(SampleCount / 2),
        frequencyData = new Uint8Array(SampleCount / 2);

    MScheduler.schedule(()=> {
        var analyzerNode = AudioPlayerService.getAnalyzerNode();

        if (!analyzerNode) {
            return;
        }

        analyzerNode.getByteFrequencyData(frequencyData);
        analyzerNode.getByteTimeDomainData(waveformData);
    }, 50);

    return {
        getWaveform(){
            return waveformData;
        },
        getFrequencies(){
            return frequencyData;
        }
    };
});