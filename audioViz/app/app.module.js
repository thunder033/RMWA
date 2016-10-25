/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('pulsar', [
    'mallet',
    'pulsar-visualizer',
    'pulsar-audio',
    'pulsar-warp',
    'checklist-model',
    'ui.router'
]).config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/visualizer');

    $stateProvider.state('visualizer', {
        url: '/visualizer',
        template: '<control-panel></control-panel><m-easel id="visualizer"></m-easel>',
        controller: function VisualizerCtrl(Visualizer) {
            Visualizer.init();
        }
    }).state('warp', {
        url: '/warp',
        template: '<m-easel id="visualizer"></m-easel>'
    });
})
.run(function(MScheduler){
    MScheduler.startMainLoop();
});
