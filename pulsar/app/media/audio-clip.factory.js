/**
 * Created by gjr8050 on 11/16/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar-media').factory('media.AudioClip', [
        'media.Type',
        'media.State',
        'AudioData',
        '$q',
        _Clip]);

    /**
     * Returns a factory reference to the AudioClip constructor
     * @returns {{AudioClip: AudioClip}}
     * @private
     */
    function _Clip(MediaType, MediaState, AudioData, $q){
        /**
         * Derive a more readable name from a file name
         * @param fileName
         * @returns {string}
         */
        function getNiceName (fileName) {
            var pcs = fileName.split('.');
            pcs.pop();
            return pcs.join('.');
        }

        /**
         * Maintains metadata and content for an audio clip
         * @property {number} id
         * @property {string} name
         * @property {string} uri
         * @property {Source} source
         * 
         * @param {Object} params
         * @param {Source} params.source
         * @param {Object} [params.id] Provides an ID of a cached audio clip to load
         * @param {string} [params.sourceId]
         * @param {string} [params.name]
         * @param {media.Type} [params.type]
         * @param {string} [params.uri]
         * @constructor
         */
        function AudioClip(params) {
            if(typeof params.id === 'undefined'){
                this.id = AudioClip.getNewId();
                this.sourceId = '' + (params.sourceId || this.id);
                this.name = getNiceName(params.name);
                this.uri = params.uri;
                this.type = params.type || MediaType.Song;
                this.clip = null;
                this.buffer = null;
                this.source = params.source;

                this.state = MediaState.Loading;
            }
            else {
                throw new ReferenceError('Cached Clips not yet supported');
            }
        }

        /**
         * Load the audio buffer for this clip
         * @returns {Promise}
         * @private
         */
        AudioClip.prototype._loadBuffer = function() {
            return this.source.getRawBuffer(this.sourceId)
                .then(AudioData.getAudioBuffer)
                .then(buffer => {
                    this.buffer = buffer;
                    this.state = MediaState.Ready;
                    return buffer;
                }).catch(err => {
                    this.state = MediaState.Error;
                });
        };

        /**
         * Retrieve the clip's audio buffer, loading it if necessary
         * @returns {IPromise<void>|Promise}
         */
        AudioClip.prototype.getBuffer = function() {
            return $q.when(this.buffer || this._loadBuffer());
        };

        /**
         * Returns true if the clip has an audio buffer
         * @returns {boolean}
         */
        AudioClip.prototype.isBuffered = function(){
            return this.buffer !== null;
        };

        AudioClip._IdKey = 'pulsar-media-item-id';
        AudioClip.autoIncrementId = parseInt(localStorage.getItem(AudioClip._IdKey)) || 0;

        /**
         * @returns {Number|number|*}
         */
        AudioClip.getNewId = function() {
            localStorage.setItem(AudioClip._IdKey, ++AudioClip.autoIncrementId);
            return AudioClip.autoIncrementId;
        };

        return AudioClip;
    }
})();