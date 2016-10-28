/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
angular.module('pulsar-audio').service('AudioPlayerService', function(SampleCount, AudioClipService, $q, MediaStates){

    var states = Object.freeze({
        LOADING: 'LOADING',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        STOPPED: 'STOPPED',
        ERROR: 'ERROR'
    });

    var self = this,
        playing = null, //currently playing clip
        sourceNode = null, //active source node (different for each track)
        audioCtx = null, //the audio context
        
        analyzerNode = null,
        convolverNode = null, //Produces reverb effects
        gainNode = null, // Master Gain node (affects visualization)
        outputGainNode = null, //Outuput gain (affects only volume)
        
        state = states.LOADING,

        _autoPlay = false,
        trackLength = 0,
        pausedAt = 0,
        trackStart = 0;

    var playHooks = [],
        ready = $q.defer();

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


    this.isReady = () => {
        return ready.promise();
    };

    /**
     * Register audio player with the service
     * This probably needs to be deleted at some point
     */
    this.registerPlayer = (autoPlay) => {
        _autoPlay = autoPlay;
        ready.resolve(true);
    };

    /**
     * Add a callback to be invoked when a new clip is played
     * @param callback
     */
    this.addPlayEventListener = (callback) => {
        if (callback instanceof Function) {
            playHooks.push(callback);
        }
    };

    this.togglePlaying = () => {
        if(state === states.PLAYING){
            sourceNode.onended = null;
            gainNode.gain.exponentialRampToValueAtTime(0.0000001, audioCtx.currentTime + 0.5);
            pausedAt = self.playbackTime;
            state = states.PAUSED;
        }
        else {
            self.playBuffer(playing.buffer, pausedAt);
            gainNode.gain.value = 1;
            trackStart = getNow() - pausedAt * 1000;
        }
    };

    /**
     * play the clip with the given ID
     * @param clipId
     * @param startTime
     */
    this.playClip = (clipId, startTime) => {
        self.stop();
        state = states.LOADING;

        var playOp = $q.defer();
        ready.promise.then(function () {
            playing = AudioClipService.getAudioClip(clipId);
            state = states.LOADING;

            if(playing && playing.buffer){
                self.playBuffer(playing.buffer, startTime);
                playOp.resolve();
            }
            else {
                audioCtx.decodeAudioData(playing.clip, buffer=> {
                    playing.buffer = buffer;
                    self.playBuffer(buffer, startTime);
                    playOp.resolve();
                });
            }

        });

        return playOp.promise;
    };

    /**
     * Player the audio buffer from the given time (in microseconds) or from the start
     * @param buffer
     * @param startTime
     */
    this.playBuffer = (buffer, startTime) => {

        self.stop();

        self.createAudioSource();
        sourceNode.buffer = buffer;
        state = states.PLAYING;
        sourceNode.start(0 , startTime || 0);
        if(_autoPlay){
            sourceNode.onended = self.playNext;
        }
        playHooks.forEach(callback => callback.call(null, playing));
        trackStart = getNow();
        trackLength = buffer.duration;
    };

    this.seekTo = (pct) => {
        if(playing){
            var time = trackLength * (pct || 0);
            self.playBuffer(playing.buffer, time);
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

    this.playNext = () => {
        if(playing){
            var next = playing;
            do {
                next = AudioClipService.getAudioClip(next.id + 1);
            } while(next.state === MediaStates.ERROR);

            self.playClip(next.id);
        }
        else {
            self.playClip(0);
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
});