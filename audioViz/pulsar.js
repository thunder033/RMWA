/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('pulsar', ['mallet','checklist-model', 'ui.router'])
    .config(function($stateProvider, $urlRouterProvider){
        $urlRouterProvider.otherwise('/visualizer');

        $stateProvider.state('visualizer', {
            url: '/visualizer',
            template: '<control-panel></control-panel><m-easel id="visualizer"></m-easel>'
        }).state('warp', {
            url: '/warp',
            template: 'This is Warp'
        });
    })
    .run(function(MScheduler, Visualizer){
        Visualizer.init();
        MScheduler.startMainLoop();
    });
