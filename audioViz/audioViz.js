/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('audio-viz', ["checklist-model"])
    .run(function(Scheduler, AudioClipService, Visualizer, AudioPlayerService, MediaStates, $timeout, AutoPlay){

        AudioPlayerService.getAnalyzerNode();
        AudioPlayerService.getConvolverNode();

        //Ensure all components render before we start trying to load songs
        $timeout(()=>{
            AudioClipService.getClipList()
                .then(AudioClipService.loadAudioClips)
                //Were using the progress event so we don't wait for everything to load
                .then(null, null, function(clip){
                    //Play AutoPlay clip when it finishes loading
                    if(clip.name == AutoPlay && clip.state == MediaStates.READY)
                        AudioPlayerService.playClip(AutoPlay);
                });
        });


        Visualizer.init();

        Scheduler.startMainLoop();
    });
