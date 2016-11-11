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
        controller: function VisualizerCtrl(Visualizer, $timeout) {
            $timeout(()=>Visualizer.init());
        }
    }).state('warp', {
        url: '/warp',
        template: '<m-easel id="warp"></m-easel><warp-hud></warp-hud>',
        controller: function WarpCtrl(Warp, MEasel,$timeout) {
            Warp.init();
            $timeout(()=>MEasel.context.canvas.style.backgroundImage = 'radial-gradient(#b2b2b2, #000)');

        }
    });


})
.run(function(MScheduler, $rootScope, AudioPlayer){
    MScheduler.startMainLoop();

    $rootScope.$on('$stateChangeStart', ()=>{
        AudioPlayer.stop();
        MScheduler.reset();
    });
});
