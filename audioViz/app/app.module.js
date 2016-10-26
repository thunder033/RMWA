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
        template: '<m-easel id="warp"></m-easel><div class="notes"><h3>WARP</h3><ul><li>This can take a long time to load.</li><li>If things start acting up just reload the page</li></div>',
        controller: function WarpCtrl(Warp) {
            Warp.init();
        }
    });
})
.run(function(MScheduler){
    MScheduler.startMainLoop();
});
