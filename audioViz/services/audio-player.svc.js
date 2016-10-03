/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('SampleCount', 1024)
    .service('AudioPlayerService', function(SampleCount, AudioClipService){

        var playing = null,
            sourceNode = null,
            audioCtx = null,
            analyzerNode = null,
            convolverNode = null,
            player;

        var playHooks = [];

        var audioPlayerService = {
            get playing(){
                return playing;
            },

            registerPlayer(newPlayer){
                player = newPlayer;
            },

            addPlayEventListener(callback){
                if(callback instanceof Function){
                    playHooks.push(callback);
                }
            },

            playClip(clipId){
                playing = AudioClipService.getAudioClip(clipId);
                player.src = playing.uri;
                player.play();

                playHooks.forEach(callback => callback.call(null, playing));
            },

            getAnalyzerNode(){
                if(!analyzerNode && player){
                    analyzerNode = audioPlayerService.createAnalyzerNode(player);
                }

                return analyzerNode;
            },

            setConvolverImpulse(impulseData){
                audioCtx.decodeAudioData(impulseData, buffer=>{
                    convolverNode.buffer = buffer;
                    convolverNode.loop = true;
                    convolverNode.normalize = true;
                    convolverNode.connect(audioCtx.destination);
                });
            },

            disableConvolverNode(){
                if(convolverNode){
                    convolverNode.disconnect();
                }
            },

            getConvolverNode(){
                if(!convolverNode && player){
                    convolverNode = audioPlayerService.createConvolverNode(player);
                }

                return convolverNode;
            },

            createAudioContextAndSource(audioElement){
                // create new AudioContext
                // The || is because WebAudio has not been standardized across browsers yet
                // http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
                audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext);

                sourceNode = sourceNode || audioCtx.createMediaElementSource(audioElement);
            },

            createConvolverNode(audioElement){
                this.createAudioContextAndSource(audioElement);

                var convolver = audioCtx.createConvolver();

                (analyzerNode || sourceNode).connect(convolver);

                return convolver;
            },

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