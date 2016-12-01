/**
 * Created by Greg on 11/21/2016.
 */
(()=>{
    'use strict';
    angular.module('pulsar.media').factory('media.source.Pulsar', [
        'media.Source',
        'mallet.AsyncRequest',
        'simple-request.HttpConfig',
        'media.AudioClip',
        'media.const.Type',
        'media.const.Path',
        '$q',
        sourcePulsarFactory]);

    /**
     * @returns {Pulsar}
     */
    function sourcePulsarFactory(Source, AsyncRequest, HttpConfig, AudioClip, MediaType, MediaPath, $q){

        /**
         * @extends Source
         */
        class Pulsar extends Source {
            constructor() {
                super('Pulsar');
            }

            /**
             * Retrieves the cache or loads local files into it if empty
             * @returns {Promise<AudioClip[]>} cachedTracks
             */
            getCachedTracks() {
                //If there's already tracks in the local cache don't load everything
                if(this._cachedTracks.length > 0){
                    return $q.when(this._cachedTracks);
                }

                //Request the local track listing, these tracks are permanently "cached"
                return AsyncRequest.send(new HttpConfig({
                    url: MediaPath.Tracks
                })).then(trackList => {
                    //Parse each track in the list
                    trackList.forEach(track => {
                        var type = track.type || MediaType.Song,
                            fileName = track.name || track,
                            url = MediaPath[type] + fileName;

                        //Load the local track into the cache
                        this._cachedTracks.push(new AudioClip({
                            source: this,
                            name: fileName,
                            type: type,
                            uri: url
                        }));
                    });

                    return this._cachedTracks;
                });
            }

            /**
             * @param {Object} params
             * @param {string} params.field
             * @param {string} params.term
             */
            search(params) {
                return this.isReady().then(()=>{
                    switch(params.field)
                    {
                        case 'name':
                        case 'type':
                            return $q.when(this._cachedTracks.filter(track => track[params.field] === params.term));
                        default:
                            return $q.when(this._cachedTracks);
                    }
                });

            }

            /**
             * Loads the audio data for the given track
             * @param {string|number} sourceId
             */
            getRawBuffer(sourceId) {
                var track = this.getTrack(sourceId);

                return super.getRawBuffer(new HttpConfig({
                    url: track.uri,
                    responseType: 'arraybuffer'
                }));
            }
        }

        return new Pulsar();
    }
})();