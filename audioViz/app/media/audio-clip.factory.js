/**
 * Created by gjr8050 on 11/16/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar-media').factory('media.AudioClip', ['media.Type', 'media.State', _Clip]);

    /**
     * Returns a factory reference to the AudioClip constructor
     * @returns {{AudioClip: AudioClip}}
     * @private
     */
    function _Clip(MediaType, MediaState){
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
         * @param {Object} params
         * @param {Object} [params.id] Provides an ID of a cached audio clip to load
         * @param {string} [params.name]
         * @param {media.Type} [params.type]
         * @param {string} [params.uri]
         * @constructor
         */
        function AudioClip(params) {
            if(typeof params.id === 'undefined'){
                this.id = AudioClip.getNewId();
                this.name = getNiceName(params.name);
                this.uri = params.uri;
                this.type = params.type || MediaType.Song;
                this.clip = null;

                this.state = MediaState.LOADING;
            }
            else {
                throw new ReferenceError('Cached Clips not yet supported');
            }
        }

        AudioClip._IdKey = 'pulsar-media-item-id';
        AudioClip.autoIncrementId = parseInt(localStorage.getItem(AudioClip._IdKey)) || 0;

        AudioClip.getNewId = function() {
            localStorage.setItem(AudioClip._IdKey, ++AudioClip.autoIncrementId);
            return AudioClip.autoIncrementId;
        };

        return AudioClip;
    }
})();