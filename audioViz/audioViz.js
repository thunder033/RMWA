/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('audio-viz', ["checklist-model"])
    .run(function(Scheduler, Visualizer){
        Visualizer.init();
        Scheduler.startMainLoop();
    });
