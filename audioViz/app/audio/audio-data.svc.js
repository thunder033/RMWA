/**
 * Created by gjr8050 on 10/19/2016.
 */
"use strict";
/**
 * Provides access to audio data and processing utilities
 */
angular.module('pulsar-audio').service('AudioData', function (MScheduler, SampleRate, SampleCount, AudioPlayer, $q) {

    var self = this,
        waveformData = new Uint8Array(SampleCount / 2),
        frequencyData = new Uint8Array(SampleCount / 2);

    MScheduler.schedule(()=> {
        var analyzerNode = AudioPlayer.getAnalyzerNode();

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

    /**
     * Generates an audio buffer for the clip and caches the result on the clip
     * @param clip
     * @returns {Promise}
     */
    this.getAudioBuffer = (clip) => {
        var renderOp = $q.defer(),
        audioCtx = new (window.AudioContext || window.webkitAudioContext);

        if(clip.buffer){
            renderOp.resolve(clip.buffer);
        }
        else {
            audioCtx.decodeAudioData(clip.clip, function(buffer) {
                clip.buffer = buffer;
                renderOp.resolve(buffer);
            });
        }

        return renderOp.promise;
    };

    /**
     * Renders discrete samples of the buffer for a given clip using an offline context
     * @param clip
     * @returns {IPromise<Array>|Promise.<Array>|*}
     */
    this.renderFrameBuffers = (clip) => {
        return self.getAudioBuffer(clip).then(buffer => {
            //Create an offline context and nodes - were dividing the sample rate by 4 so that things don't crash when add dual channel
            var offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.sampleRate * buffer.duration / 4, buffer.sampleRate / 4),
                processor = offlineCtx.createScriptProcessor(SampleCount, buffer.numberOfChannels, buffer.numberOfChannels),
                sourceNode = offlineCtx.createBufferSource();

            //set nodes up
            sourceNode.connect(processor);
            processor.connect(offlineCtx.destination);

            /*
             As the offline context renders buffers, capture them
             Each of these will contain the raw PCM data for a short duration of the clip
             This would be nice to do in a web worker, but no support :(
             */
            var frameBuffers = [];
            processor.onaudioprocess = (e) => {
                //Were only using the left channel at the moment
                var data = e.inputBuffer.getChannelData(0),
                    copy = new Float32Array(data.length);

                //We have to manually copy the array because any other method crashes the browser
                for(var i = 0; i < data.length; i++){
                    copy[i] = data[i];
                }

                frameBuffers.push(copy);
            };

            //start rendering the buffer
            sourceNode.buffer = buffer;
            sourceNode.start();
            return offlineCtx.startRendering()
                .then(() =>{ return {
                    frameBuffers: frameBuffers,
                    sampleRate: buffer.sampleRate / 4,
                    duration: buffer.duration
                }});
        });
    }
});