/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('audio-viz', [])
    .run(function(Scheduler, AudioClipService, Visualizer){

        AudioClipService.loadAudioClips([
            'Beam (Orchestral Remix).mp3',
            'New Adventure Theme.mp3',
            'Peanuts Theme.mp3',
            'The Picard Song.mp3'
        ]).then(function(){
            console.log(AudioClipService.getAudioClips());
        });

        Visualizer.init();

        Scheduler.startMainLoop();
    });