/**
 * Created by gjr8050 on 11/16/2016.
 */
angular.module('pulsar.media')
//Media Loading
    .constant('media.Path', Object.freeze({
        Base: 'assets/audio/',
        ReverbImpulse: 'assets/reverb-impulses/',
        Tracks: 'assets/data/localAudio.json'
    }))
    .constant('media.Sources', Object.freeze({
        Local: 'Local'
    }))
    .constant('media.AutoPlay', "New Adventure Theme") //what song to auto-play
    .constant('media.State', Object.freeze({
        Ready: 'Ready',
        Loading: 'Loading',
        Error: 'Error'
    }))

    /**
     * Indicates the usage of an AudioClip
     * @property {media.Type} Song
     * @property {media.Type} Effect
     * @property {media.Type} ReverbImpulse
     */
    .constant('media.Type', Object.freeze({
        "Song": 'Song',
        'Effect': 'Effect',
        'ReverbImpulse' : 'ReverbImpulse'
    }));