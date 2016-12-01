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
    /**
     * @description Indicates what state a media object is in
     * @property {media.State} Ready: The clip is ready to begin buffering
     * @property {media.State} Buffering: The clip is currently buffering
     * @property {media.State} Buffer: The clip has buffered and is ready to be played
     * @property {media.State} Error: An error was encountered while preparing the clip
     */
    .constant('media.const.State', {
        Ready: 'Ready',
        Buffering: 'Buffering',
        Buffered: 'Buffered',
        Error: 'Error'
    })

    /**
     * Indicates the usage of an AudioClip
     * @type {media.Type}
     * @property {media.Type} Song
     * @property {media.Type} Effect
     * @property {media.Type} ReverbImpulse
     */
    .constant('media.const.Type', Object.freeze({
        'Song': 'Song',
        'Effect': 'Effect',
        'ReverbImpulse' : 'ReverbImpulse'
    }));