/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('audio-viz', ["checklist-model"])
    .run(function(Scheduler, AudioClipService, Visualizer, AudioPlayerService, MediaStates, $timeout){

        AudioPlayerService.getAnalyzerNode();
        AudioPlayerService.getConvolverNode();

        var audioClips = [
            //Audio clips from local machine
            'Kitchen Sink.mp3',
            'Hallelujah.wav',
            'Be Concerned.mp3',
            'Trees.mp3',
            'Panic Station.mp3',
            'Secrets.mp3',
            'Undisclosed Desires.mp3',
            'Beam (Orchestral Remix).mp3',
            'Remember the name.mp3',
            //Class Provided Samples
            'New Adventure Theme.mp3',
            'Peanuts Theme.mp3',
            'The Picard Song.mp3',
            //Impulse samples: Samplicity (http://www.samplicity.com/bricasti-m7-impulse-responses/)
            {name: 'Concert Hall.wav', type: 'reverbImpulse'},
            {name: 'Arena.wav', type: 'reverbImpulse'},
            {name: 'Bass Boost.wav', type: 'reverbImpulse'}
        ];

        //Ensure all components render before we start trying to load songs
        $timeout(()=>{
            AudioClipService.loadAudioClips(audioClips)
                //Were using the progress event so we don't wait for everything to load
                .then(null, null, function(clip){
                    //Play Trees when it finishes loading
                    if(clip.name == "Trees" && clip.state == MediaStates.READY)
                        AudioPlayerService.playClip("Trees");
                });
        });


        Visualizer.init();

        Scheduler.startMainLoop();
    });
