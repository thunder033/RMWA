/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.service('AudioPlayerService', function(SampleCount, AudioClipService, $q){

    var states = Object.freeze({
        LOADING: 'LOADING',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        STOPPED: 'STOPPED',
        ERROR: 'ERROR'
    });


    var playing = null,
        sourceNode = null,
        audioCtx = null,
        analyzerNode = null,
        convolverNode = null,
        gainNode = null,
        state = states.LOADING,
        player,

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

    var audioPlayerService = {
        init(){
            analyzerNode = this.createAnalyzerNode();
            gainNode = this.createMasterGainNode();
            convolverNode = this.createConvolverNode();
        },

        get states(){
            return states;
        },

        get state(){
            return state;
        },

        get playing() {
            return playing;
        },

        get context() {
            return audioCtx;
        },

        get playbackTime(){
           return getPlaybackTime();
        },

        get trackLength(){
            return trackLength;
        },

        get completionPct(){
            return getPlaybackTime() / trackLength;
        },

        isReady(){
            return ready.promise();
        },

        /**
         * Register audio player with the service
         */
        registerPlayer(){
            ready.resolve(true);
        },

        /**
         * Add a callback to be invoked when a new clip is played
         * @param callback
         */
        addPlayEventListener(callback){
            if (callback instanceof Function) {
                playHooks.push(callback);
            }
        },

        togglePlaying(){
            if(state === states.PLAYING){
                sourceNode.onended = null;
                gainNode.gain.exponentialRampToValueAtTime(0.0000001, audioCtx.currentTime + 0.5);
                pausedAt = audioPlayerService.playbackTime;
                state = states.PAUSED;
            }
            else {
                audioPlayerService.playBuffer(playing.buffer, pausedAt);
                gainNode.gain.value = 1;
                trackStart = getNow() - pausedAt * 1000;
            }
        },

        /**
         * play the clip with the given ID
         * @param clipId
         * @param startTime
         */
        playClip(clipId, startTime){
            if(sourceNode){
                sourceNode.onended = null;
                sourceNode.stop(0);
                state = states.LOADING;
            }

            ready.promise.then(function () {
                playing = AudioClipService.getAudioClip(clipId);
                state = states.LOADING;

                audioCtx.decodeAudioData(playing.clip, buffer=> {
                    playing.buffer = buffer;
                    audioPlayerService.playBuffer(buffer, startTime);
                });
            });
        },

        /**
         * Player the audio buffer from the given time (in microseconds) or from the start
         * @param buffer
         * @param startTime
         */
        playBuffer(buffer, startTime){
            if(sourceNode){
                sourceNode.onended = null;
                sourceNode.stop(0);
            }

            audioPlayerService.createAudioSource();
            sourceNode.buffer = buffer;
            state = states.PLAYING;
            sourceNode.start(0 , startTime || 0);
            sourceNode.onended = audioPlayerService.playNext;
            playHooks.forEach(callback => callback.call(null, playing));
            trackStart = getNow();
            trackLength = buffer.duration;
        },

        playNext(){
            if(playing){
                audioPlayerService.playClip(playing.id + 1);
            }
        },

        /**
         * Retrieve, and create if necessary, an analyzer node
         * @returns {*}
         */
        getAnalyzerNode(){
            return analyzerNode;
        },

        /**
         * Set the active impulse clip on the convolver node
         * @param impulseData
         */
        setConvolverImpulse(impulseData){
            var convolverNode = audioPlayerService.getConvolverNode();

            audioCtx.decodeAudioData(impulseData, buffer=> {
                convolverNode.buffer = buffer;
                convolverNode.loop = true;
                convolverNode.normalize = true;
                convolverNode.connect(audioCtx.destination);
            });
        },

        /**
         * Turn off the convolver node
         */
        disableConvolverNode(){
            if (convolverNode) {
                convolverNode.disconnect();
            }
        },

        /**
         * Retrieve, and create if necessary, the convolver node
         * @returns {*}
         */
        getConvolverNode(){
            return convolverNode;
        },

        getGainNode(){
            return gainNode;
        },

        createAudioSource(){
            sourceNode = audioCtx.createBufferSource();
            sourceNode.connect(gainNode);
        },

        /**
         * Create an audio context and source node in the service
         */
        createAudioContext(){
            // create new AudioContext
            // The || is because WebAudio has not been standardized across browsers yet
            // http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext);
        },

        /**
         * Create a convolver node in the service
         * @returns {ConvolverNode}
         */
        createConvolverNode(){
            this.createAudioContext();
            var convolver = audioCtx.createConvolver();

            (analyzerNode).connect(convolver);

            return convolver;
        },

        /**
         * Create an analyzer node
         * @returns {AnalyserNode|*}
         */
        createAnalyzerNode(){
            var analyserNode;
            this.createAudioContext();

            // create an analyser node
            analyserNode = audioCtx.createAnalyser();

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
            analyserNode.connect(audioCtx.destination);
            return analyserNode;
        },

        createMasterGainNode(){
            var gainNode;
            this.createAudioContext();

            gainNode = audioCtx.createGain();
            gainNode.connect(analyzerNode);

            return gainNode;
        }
    };

    audioPlayerService.init();

    return audioPlayerService;
});