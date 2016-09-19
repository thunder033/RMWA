/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('SAMPLE_COUNT', 256)
    .service('AudioPlayerService', function(SAMPLE_COUNT, AudioClipService){

        var playing = null,
            analyzerNode = null,
            player;

        var audioPlayerService = {
            get playing(){
                return playing;
            },

            registerPlayer(newPlayer){
                player = newPlayer;
            },

            playClip(clipId){
                playing = AudioClipService.getAudioClip(clipId);
                player.src = playing.uri;
                player.play();
            },

            getAnalyzerNode(){
                if(!analyzerNode && player){
                    analyzerNode = audioPlayerService.createAnalyzerNode(player);
                }

                return analyzerNode;
            },

            createAnalyzerNode(audioElement){
                var audioCtx, analyserNode, sourceNode;
                // create new AudioContext
                // The || is because WebAudio has not been standardized across browsers yet
                // http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
                audioCtx = new (window.AudioContext || window.webkitAudioContext);

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
                analyserNode.fftSize = SAMPLE_COUNT;

                // this is where we hook up the <audio> element to the analyserNode
                sourceNode = audioCtx.createMediaElementSource(audioElement);
                sourceNode.connect(analyserNode);

                // here we connect to the destination i.e. speakers
                analyserNode.connect(audioCtx.destination);
                return analyserNode;
            }
        };

        return audioPlayerService;
    });