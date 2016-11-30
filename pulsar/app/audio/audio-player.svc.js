/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
var EventTarget = require('eventtarget');

(()=>{
    require('angular').module('pulsar.audio').service('audio.Player', [
        'mallet.const.SampleCount',
        Player]);

    /**
     *
     * @param SampleCount
     * @constructor
     * @extends EventTarget
     */
    function Player(SampleCount){

        EventTarget.call(this);

        var states = Object.freeze({
            Loading: 'Loading',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            STOPPED: 'STOPPED',
            Error: 'Error'
        });

        var self = this,
            /**
             * currently playing clip
             * @type {IPlayable}
             */
            playing = null,
            sourceNode = null, //active source node (different for each track)
            audioCtx = null, //the audio context

            analyzerNode = null,
            convolverNode = null, //Produces reverb effects
            gainNode = null, // Master Gain node (affects visualization)
            outputGainNode = null, //Output gain (affects only volume)

            state = states.Loading,

            trackLength = 0,
            pausedAt = 0,
            trackStart = 0;

        function getNow() {
            return (new Date()).getTime();
        }

        function getPlaybackTime(){
            switch(state){
                case states.PAUSED:
                    return pausedAt;
                case states.PLAYING:
                    return (getNow() - trackStart) / 1000;
                default:
                    return 0;
            }
        }

        Object.defineProperties(this, {
            'states': {get: () => states},
            'state': {get: () => state},
            'playing': {get: () => playing},
            'context': {get: () => audioCtx},
            'trackLength': {get: () => trackLength},
            'playbackTime': {get: () => getPlaybackTime()},
            'completionPct': {get: () => getPlaybackTime() / trackLength}
        });


        this.init = () => {
            self.createAudioContext();
            outputGainNode = self.createOutputGainNode(audioCtx);
            analyzerNode = self.createAnalyzerNode(audioCtx);
            gainNode = self.createMasterGainNode(audioCtx);
            convolverNode = self.createConvolverNode(audioCtx);
        };

        /**
         * Pause playback if the player is playing
         */
        this.pause = () => {
            if(state === states.PLAYING){
                sourceNode.onended = null;
                gainNode.gain.exponentialRampToValueAtTime(0.00000001, audioCtx.currentTime + 0.5);
                pausedAt = self.playbackTime;
                state = states.PAUSED;
            }
        };

        /**
         * Resume playback if the player is currently paused
         */
        this.resume = () =>{
            if(state === states.PAUSED){
                gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                self.playBuffer(sourceNode.buffer, pausedAt);
                gainNode.gain.value = 1;
                trackStart = getNow() - pausedAt * 1000;
            }
        };

        /**
         * If the player is playing
         */
        this.togglePlaying = () => {
            if(state === states.PLAYING){
                self.pause();
            }
            else {
                self.resume();
            }
        };

        this.setOutputGain = volume => {
            outputGainNode.gain.value = volume;
        };

        /**
         * play the clip with the given ID
         * @param {IPlayable} clip
         * @param {number} [startTime=0]
         */
        this.playClip = (clip, startTime) => {
            self.stop();

            playing = clip;
            state = states.Loading;

            return playing.getBuffer().then(buffer => {
                self.playBuffer(buffer, startTime || 0);
            });
        };

        /**
         * Player the audio buffer from the given time (in microseconds) or from the start
         * @param {AudioBuffer} buffer
         * @param {number} [startTime=0]
         */
        this.playBuffer = (buffer, startTime) => {

            self.stop();

            self.createAudioSource();
            sourceNode.buffer = buffer;
            state = states.PLAYING;
            gainNode.gain.value = 1;
            sourceNode.start(0 , startTime || 0);
            sourceNode.onended = () => this.dispatchEvent('ended');
            this.dispatchEvent('play');
            trackStart = getNow();
            trackLength = buffer.duration;
        };

        this.seekTo = (pct) => {
            if(playing){
                var time = trackLength * (pct || 0);
                self.playBuffer(sourceNode.buffer, time);
                trackStart = getNow() - time * 1000;
            }

        };

        this.stop = () => {
            //playing = null;
            if(sourceNode){
                sourceNode.onended = null;
                sourceNode.stop(0);
                state = states.STOPPED;
            }
        };

        /**
         * Retrieve, and create if necessary, an analyzer node
         * @returns {*}
         */
        this.getAnalyzerNode = () => {
            return analyzerNode;
        };

        /**
         * Set the active impulse clip on the convolver node
         * @param impulseData
         */
        this.setConvolverImpulse = (impulseData) => {
            var convolverNode = self.getConvolverNode();

            audioCtx.decodeAudioData(impulseData, buffer=> {
                convolverNode.buffer = buffer;
                convolverNode.loop = true;
                convolverNode.normalize = true;
                convolverNode.connect(audioCtx.destination);
            });
        };

        /**
         * Turn off the convolver node
         */
        this.disableConvolverNode = () => {
            if (convolverNode) {
                convolverNode.disconnect();
            }
        };

        /**
         * Retrieve, and create if necessary, the convolver node
         * @returns {*}
         */
        this.getConvolverNode = () => {
            return convolverNode;
        };

        this.getGainNode = () => {
            return gainNode;
        };

        this.createAudioSource = () => {
            sourceNode = audioCtx.createBufferSource();
            sourceNode.connect(gainNode);
        };

        /**
         * Create an audio context and source node in the service
         */
        this.createAudioContext = () => {
            // create new AudioContext
            // The || is because WebAudio has not been standardized across browsers yet
            // http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext);
        };

        /**
         * Create a convolver node in the service
         * @returns {ConvolverNode}
         */
        this.createConvolverNode = (ctx) => {
            var convolver = ctx.createConvolver();
            (analyzerNode).connect(convolver);
            return convolver;
        };

        /**
         * Create an analyzer node
         * @returns {AnalyserNode|*}
         */
        this.createAnalyzerNode = (ctx) => {
            // create an analyser node
            var analyserNode = ctx.createAnalyser();

            /*
             We will request NUM_SAMPLES number of samples or "bins" spaced equally
             across the sound spectrum.

             If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz,
             the third is 344Hz. Each bin contains a number between 0-255 representing
             the amplitude of that frequency.
             */

            // fft stands for Fast Fourier Transform
            analyserNode.fftSize = SampleCount;

            // here we connect to the destination i.e. speakers
            analyserNode.connect(outputGainNode);
            return analyserNode;
        };

        this.createMasterGainNode = (ctx) => {
            var gainNode = ctx.createGain();
            gainNode.connect(analyzerNode);

            return gainNode;
        };

        this.createOutputGainNode = (ctx) => {
            var gainNode = ctx.createGain();
            gainNode.connect(audioCtx.destination);

            return gainNode;
        };

        this.init();
    }
})();
