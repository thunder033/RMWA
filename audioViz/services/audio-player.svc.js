/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.service('AudioPlayerService', function(SampleCount, AudioClipService, $q){

        var playing = null,
            sourceNode = null,
            audioCtx = null,
            analyzerNode = null,
            convolverNode = null,
            player;

        var playHooks = [],
            deferred = $q.defer();

        var audioPlayerService = {
            get playing(){
                return playing;
            },

            isReady(){
                return deferred.promise();
            },

            /**
             * Register audio player with the service
             * @param newPlayer
             */
            registerPlayer(newPlayer){
                player = newPlayer;
                if(newPlayer){
                    deferred.resolve(true);
                }
                else {
                    deferred.reject();
                }
            },

            /**
             * Add a callback to be invoked when a new clip is played
             * @param callback
             */
            addPlayEventListener(callback){
                if(callback instanceof Function){
                    playHooks.push(callback);
                }
            },

            /**
             * play the clip with the given ID
             * @param clipId
             */
            playClip(clipId){
                deferred.promise.then(function(){
                    playing = AudioClipService.getAudioClip(clipId);
                    player.src = playing.uri;
                    player.play();

                    playHooks.forEach(callback => callback.call(null, playing));
                });
            },

            /**
             * Retrieve, and create if necessary, an analyzer node
             * @returns {*}
             */
            getAnalyzerNode(){
                if(!analyzerNode && player){
                    analyzerNode = audioPlayerService.createAnalyzerNode(player);
                }

                return analyzerNode;
            },

            /**
             * Set the active impulse clip on the convolver node
             * @param impulseData
             */
            setConvolverImpulse(impulseData){
                var convolverNode = audioPlayerService.getConvolverNode();

                audioCtx.decodeAudioData(impulseData, buffer=>{
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
                if(convolverNode){
                    convolverNode.disconnect();
                }
            },

            /**
             * Retrieve, and create if necessary, the convolver node
             * @returns {*}
             */
            getConvolverNode(){
                if(!convolverNode && player){
                    convolverNode = audioPlayerService.createConvolverNode(player);
                }

                return convolverNode;
            },

            /**
             * Create an audio context and source node in the service
             * @param audioElement
             */
            createAudioContextAndSource(audioElement){
                // create new AudioContext
                // The || is because WebAudio has not been standardized across browsers yet
                // http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
                audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext);

                sourceNode = sourceNode || audioCtx.createMediaElementSource(audioElement);
            },

            /**
             * Create a convolver node in the service
             * @param audioElement
             * @returns {ConvolverNode}
             */
            createConvolverNode(audioElement){
                this.createAudioContextAndSource(audioElement);

                var convolver = audioCtx.createConvolver();

                (analyzerNode || sourceNode).connect(convolver);

                return convolver;
            },

            /**
             * Create an analyzer node
             * @param audioElement
             * @returns {AnalyserNode|*}
             */
            createAnalyzerNode(audioElement){
                var analyserNode;
                this.createAudioContextAndSource(audioElement);

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

                // this is where we hook up the <audio> element to the analyserNode
                sourceNode.connect(analyserNode);

                // here we connect to the destination i.e. speakers
                analyserNode.connect(audioCtx.destination);
                return analyserNode;
            }
        };

        return audioPlayerService;
    });