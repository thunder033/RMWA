/**
 * Created by gjr8050 on 11/16/2016.
 */
angular.module('pulsar.media')
//Media Loading
    .constant('media.const.Path', Object.freeze({
        Base: 'assets/audio/',
        ReverbImpulse: 'assets/reverb-impulses/',
        Tracks: 'assets/data/localAudio.json'
    }))
    .constant('media.const.Sources', Object.freeze({
        Pulsar: 'Pulsar'
    }))
    .constant('media.const.State', Object.freeze({
        Ready: 'Ready', //The clip is ready to begin buffering
        Buffering: 'Buffering', //The clip is currently buffering
        Buffered: 'Buffered', //The clip has buffered and is ready to be played
        Error: 'Error' //An error was encountered while preparing the clip
    }))

    /**
     * Indicates the usage of an AudioClip
     * @property {media.Type} Song
     * @property {media.Type} Effect
     * @property {media.Type} ReverbImpulse
     */
    .constant('media.const.Type', Object.freeze({
        'Song': 'Song',
        'Effect': 'Effect',
        'ReverbImpulse' : 'ReverbImpulse'
    }));