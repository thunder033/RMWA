/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('pulsar', ['mallet','checklist-model'])
    .run(function(MScheduler, Visualizer){
        Visualizer.init();
        MScheduler.startMainLoop();
    });
