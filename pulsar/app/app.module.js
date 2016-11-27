/**
 * Created by gjr8050 on 9/14/2016.
 */
"use strict";
var app = angular.module('pulsar', [
    'mallet',
    'pulsar.flare',
    'pulsar.audio',
    'pulsar.warp',
    'pulsar.media',
    'checklist-model',
    'ui.router'
]).config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/flare');

    $stateProvider.state('flare', {
        url: '/flare',
        template: '<control-panel></control-panel><m-easel id="visualizer"></m-easel>',
        controller: function FlareCtrl(Flare, $timeout) {
            $timeout(()=>Flare.init());
        }
    }).state('warp', {
        url: '/warp',
        template: '<m-easel id="warp"></m-easel><warp-hud></warp-hud>',
        controller: 'warp.GameController'
    });


})
.run(['MScheduler', '$rootScope', 'audio.Player', function(MScheduler, $rootScope, AudioPlayer){
    MScheduler.startMainLoop();

    $rootScope.$on('$stateChangeStart', ()=>{
        AudioPlayer.stop();
        MScheduler.reset();
    });
}]);
