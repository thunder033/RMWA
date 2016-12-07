/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
'use strict';
require('angular').module('pulsar.media').factory('media.source.SoundCloud', [
    'media.Source',
    'simple-request.HttpConfig',
    'media.const.Type',
    'media.AudioClip',
    sourceSoundCloudFactory
]);

function sourceSoundCloudFactory(Source, HttpConfig, MediaType, AudioClip){

    class SoundCloud extends Source {

        constructor() {
            super('SoundCloud');
            this.apiUrl = 'http://thunderlab.net/pulsar-media/api/soundcloud/';
        }

        /**
         *
         * @param reqType
         * @param params
         * @returns {*}
         * @private
         */
        _getRequestUrl(reqType, params){
            var reqUrl = this.apiUrl;
            switch(reqType) {
                case 'search':
                    reqUrl += `tracks?q=${params.term}`;
                    break;
                case 'track':
                    reqUrl += `tracks/${params.trackId}/streams`;
                    break;
                default:
                    return null;
            }

            return reqUrl;
        }

        search(params) {
            var url = this._getRequestUrl('search', {term: params.term});

            return Source._queueRequest(HttpConfig.get(url))
                .then(results => {
                    //Parse each track in the list
                    results.forEach(track => {

                        //Load the local track into the cache
                        this._cachedTracks.push(new AudioClip({
                            source: this,
                            name: track.title,
                            type: MediaType.Song,
                            uri: track.stream_url
                        }));
                    });

                    return this._cachedTracks;
                });
        }

        getRawBuffer(sourceId) {
            var url = this._getRequestUrl('track', {trackId: sourceId});
            // Example SoundCloud URI (using proxy script)
            // http://thunderlab.net/pulsar-media/api/soundcloud/tracks/231543423
            return Source._queueRequest(HttpConfig.get(url)).then(streamUrl => {
                return super.getRawBuffer(new HttpConfig({
                    url: streamUrl,
                    responseType: 'arraybuffer'
                }));
            });
        }
    }

    return SoundCloud;
}