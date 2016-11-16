/**
 * Created by gjr8050 on 11/16/2016.
 */
angular.module('pulsar.media')
//Media Loading
    .constant('media.Path', Object.freeze({
        Base: 'assets/audio/',
        ReverbImpulse: 'assets/reverb-impulses/'
    }))
    .constant('media.AutoPlay', "New Adventure Theme") //what song to auto-play
    .constant('media.State', Object.freeze({
        READY: 'READY',
        LOADING: 'LOADING',
        ERROR: 'ERROR'
    }))
    .constant('media.Type', Object.freeze({
        "Song": 'Song',
        'Effect': 'Effect',
        'ReverbImpulse' : 'ReverbImpulse'
    }));