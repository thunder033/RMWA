/**
 * Created by gjr8050 on 9/14/2016.
 */
'use strict';

// misc local dependencies
require('../assets/js/priorityQueue');
require('../assets/js/load-error');

// external dependencies
var angular = require('angular'),

    mallet = require('./mallet'),
    simpleRequest = require('./shared/simple-request'),

    //Pulsar modules
    constants = require('./app.constants'),
    shared = require('./shared'),
    audio = require('./audio'),
    media = require('./media'),
    flare = require('./flare'),
    warp = require('./warp');

require('angular-ui-router');
require('checklist-model');

var app = angular.module('pulsar', [
    constants.name,
    shared.name,
    mallet.name,
    flare.name,
    audio.name,
    warp.name,
    media.name,
    simpleRequest.name,
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
