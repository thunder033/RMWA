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
    config = require('./config.module'),
    constants = require('./app.constants'),
    shared = require('./shared'),
    audio = require('./audio'),
    media = require('./media'),
    flare = require('./flare'),
    warp = require('./warp');

var app = angular.module('pulsar', [
    config.name,
    constants.name,
    shared.name,
    mallet.name,
    flare.name,
    audio.name,
    warp.name,
    media.name,
    simpleRequest.name,
    require('checklist-model'),
    require('angular-ui-router')
]).config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    //message about error messages
    console.info('READMEEEEE: Any HEAD requests with status 404 are expected. Network errors cannot be suppressed through JavaScript.');
    $urlRouterProvider.otherwise('/flare');

    $stateProvider.state('flare', {
        url: '/flare',
        template: '<control-panel></control-panel><m-easel id="visualizer"></m-easel>',
        controller: 'flare.FlareController'
    }).state('warp', {
        url: '/warp',
        template: '<m-easel id="warp"></m-easel><warp-hud></warp-hud>',
        controller: 'warp.GameController'
    });

}]).run(['MScheduler', '$rootScope', 'audio.Player', function(MScheduler, $rootScope, AudioPlayer){
    MScheduler.startMainLoop();

    $rootScope.$on('$stateChangeStart', ()=>{
        AudioPlayer.stop();
        MScheduler.reset();
    });
}]);