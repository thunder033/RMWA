/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('audio-viz', [])
    .run(function(Scheduler, AudioClipService, Visualizer, AudioPlayerService){

        AudioClipService.loadAudioClips([
            'Be Concerned.mp3',
            'Trees.mp3',
            'Panic Station.mp3',
            'Secrets.mp3',
            'Undisclosed Desires.mp3',
            'Beam (Orchestral Remix).mp3',
            'New Adventure Theme.mp3',
            'Peanuts Theme.mp3',
            'The Picard Song.mp3'
        ]).then(function(){
            AudioPlayerService.playClip("Trees");
            console.log(AudioClipService.getAudioClips());
        });

        Visualizer.init();

        Scheduler.startMainLoop();
    });