/**
 * Created by Greg on 11/21/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar.media').factory('media.Source', [
        'mallet.AsyncRequest',
        '$q',
        sourceFactory]);

    function sourceFactory(AsyncRequest, $q) {
        var sources = {},
            threadCount = 5,
            requestPool = AsyncRequest.createRequestPool(threadCount);

        /**
         *
         * @param {string} name
         * @constructor
         */
        function Source(name) {
            sources[name] = this;
            this.name = name;
            this._cachedTracks = [];
            this._tracks = {};

            this._ready = this.loadCachedTracks();
        }

        Source.getCachedTracks = function() {
            return $q.when(this._cachedTracks);
        };

        Source.prototype.loadCachedTracks = function(){
            return this.getCachedTracks().then(trackList => {
                trackList.forEach(track => this._tracks[track.sourceId] = track);
            });
        };

        Source.prototype.isReady = function(){
            return this._ready;
        };

        /**
         * Returns a list of audio tracks matching the term
         * @param {Object} params
         */
        Source.prototype.search = function(params) {
            return $q.when([]);
        };

        /**
         * Queues an http request and promises an audio buffer
         * @param {HttpConfig} config
         * @returns {Promise<ArrayBuffer>}
         */
        Source.prototype.getRawBuffer = function(config) {
            return requestPool.send(config);
        };

        /**
         * Encapsulate source-specific requirements of loading an audio track
         * @param {string|number} sourceId
         * @returns {AudioClip}
         */
        Source.prototype.getTrack = function(sourceId) {
            return this._tracks[sourceId];
        };

        /**
         * Return the map of registered sources
         * @returns {{string: Source}}
         */
        Source.getSources = function(){
            return sources;
            //return Object.keys(sources).map(name => sources[name]);
        };

        return Source;
    }

   
})();