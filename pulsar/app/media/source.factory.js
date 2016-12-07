/**
 * Created by Greg on 11/21/2016.
 */
(()=>{
    'use strict';

    angular.module('pulsar.media').factory('media.Source', [
        'mallet.AsyncRequest',
        '$q',
        sourceFactory]);

    function sourceFactory(AsyncRequest, $q) {
        var sources = {},
            threadCount = 5,
            requestPool = AsyncRequest.createRequestPool(threadCount);

        class Source {
            /**
             *
             * @param {string} name
             * @constructor
             */
            constructor(name) {
                sources[name] = this;
                this.name = name;
                this._cachedTracks = [];
                this._tracks = {};

                this._ready = this.loadCachedTracks();
            }

            getCachedTracks() {
                return $q.when(this._cachedTracks);
            }

            loadCachedTracks() {
                return this.getCachedTracks().then(trackList => {
                    trackList.forEach(track => this._tracks[track.sourceId] = track);
                });
            }

            isReady() {
                return this._ready;
            }

            /**
             * Returns a list of audio tracks matching the term
             * @param {Object} params
             */
            search(params) {
                return $q.when([]);
            }

            /**
             * Send a request using the source request pool
             * @param config
             * @returns {Promise.<Object>|*}
             * @private
             */
            static _queueRequest(config){
                return requestPool.send(config);
            }

            /**
             * Queues an http request and promises an audio buffer
             * @param {HttpConfig} config
             * @returns {Promise<ArrayBuffer>}
             */
            getRawBuffer(config) {
                return requestPool.send(config);
            }

            /**
             * Encapsulate source-specific requirements of loading an audio track
             * @param {string|number} sourceId
             * @returns {AudioClip}
             */
            getTrack(sourceId) {
                return this._tracks[sourceId];
            }
        }

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