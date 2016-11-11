/**
 * Created by gjr8050 on 11/11/2016.
 */
"use strict";
angular.module('pulsar.audio').factory('audio.audioFx',['MediaLibrary', 'AudioData', '$q', function (AudioClip, AudioData, $q) {

    var audioCtx = new (window.AudioContext || window.webkitAudioContext),
        autoId = 0,
        gain = audioCtx.createGain();

    gain.connect(audioCtx.destination);

    /**
     * @param {Object} params
     * @param {string} params.clipId
     * @constructor
     */
    function Effect(params){
        this.clip = AudioClip.getAudioClip(params.clipId);
        this.ready = $q.when(this);

        if(!this.clip.buffer){
            this.ready = AudioData.getAudioBuffer(this.clip)
                .then(buffer => {
                    this.clip.buffer = buffer;
                    return this;
                });
        }

        this.instances = {};
    }

    Effect.prototype.isReady = function(){
        return this.ready;
    };

    Effect.prototype.playInstance = function() {
        return this.isReady()
            .then(()=>{
                var source = audioCtx.createBufferSource();
                source.connect(gain);
                source.buffer = this.clip.buffer;
                source.start(0);
                this.instances[autoId++] = source;
                source.onended = () => delete source[autoId];
                return source;
            });
    };

    Effect.prototype.stopAll = function() {
        Object.keys(this.instances).forEach(id => {
            this.instances[id].stop(0);
        });

        this.instances = {};
    };

    return {
        Effect: Effect
    }
}]);