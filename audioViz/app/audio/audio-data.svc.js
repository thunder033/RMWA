/**
 * Created by gjr8050 on 10/19/2016.
 */
"use strict";
/**
 * Provides access to audio data
 */
angular.module('pulsar-audio').service('AudioData', function (MScheduler, SampleRate, SampleCount, AudioPlayerService, $q) {

    var self = this,
        waveformData = new Uint8Array(SampleCount / 2),
        frequencyData = new Uint8Array(SampleCount / 2);

    MScheduler.schedule(()=> {
        var analyzerNode = AudioPlayerService.getAnalyzerNode();

        if (!analyzerNode) {
            return;
        }

        analyzerNode.getByteFrequencyData(frequencyData);
        analyzerNode.getByteTimeDomainData(waveformData);
    }, 50);

    this.getWaveform = () => {
        return waveformData;
    };

    this.getFrequencies = () => {
        return frequencyData;
    };

    this.getAudioBuffer = (clip) => {
        var renderOp = $q.defer(),
        audioCtx = new (window.AudioContext || window.webkitAudioContext);

        audioCtx.decodeAudioData(clip.clip, function(buffer) {
            renderOp.resolve(buffer);
        });

        return renderOp.promise;
    };

    /**
     * Renders discrete samples of the buffer for a given clip using an offline context
     * @param clip
     * @returns {IPromise<Array>|Promise.<Array>|*}
     */
    this.renderFrameBuffers = (clip) => {
        return self.getAudioBuffer(clip).then(buffer => {
            //Create an offline context and nodes
            var offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.sampleRate * buffer.duration, buffer.sampleRate),
                processor = offlineCtx.createScriptProcessor(SampleCount, 1, 1),
                sourceNode = offlineCtx.createBufferSource();

            sourceNode.connect(processor);
            processor.connect(offlineCtx.destination);

            /*
             As the offline context renders buffers, capture them
             Each of these will contain the raw PCM data for a short duration of the clip
             */
            var frameBuffers = [];
            processor.onaudioprocess = (e) => {
                frameBuffers.push(e.inputBuffer.getChannelData(0));
            };

            //start rendering the buffer
            sourceNode.buffer = buffer;
            sourceNode.start();
            return offlineCtx.startRendering()
                .then(() =>{ return {
                    frameBuffers: frameBuffers,
                    sampleRate: buffer.sampleRate,
                    duration: buffer.duration
                }});
        });
    }
});