/**
 * Handles requests to the SoundCloud API endpoint
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
                    var term = encodeURIComponent(params.term);
                    reqUrl += `tracks?q=${term}&limit=50`;
                    break;
                case 'track':
                    reqUrl += `tracks/${params.trackId}/stream`;
                    break;
                default:
                    return null;
            }

            return reqUrl;
        }

        search(params) {
            if(params.term === '' || params.field !== 'name'){
                return super.search(params);
            }

            var url = this._getRequestUrl('search', {term: params.term});

            function trackCompare(a, b)
            {
                return parseInt(a.playback_count) > parseInt(b.playback_count) ? -1 : 1;
            }

            return Source._queueRequest(HttpConfig.get(url))
                .then(results => {
                    //Parse each track in the list
                    return results.sort(trackCompare).map(track => {
                        console.log(track.title);
                        //Load the local track into the cache
                        return new AudioClip({
                            source: this,
                            sourceId: track.id,
                            name: track.title + `(${track.playback_count})`,
                            type: MediaType.Song,
                            uri: track.stream_url
                        });
                    });
                });
        }

        getRawBuffer(sourceId) {
            var url = this._getRequestUrl('track', {trackId: sourceId});
            // Example SoundCloud URI (using proxy script)
            // http://thunderlab.net/pulsar-media/api/soundcloud/tracks/231543423
            return super.getRawBuffer(new HttpConfig({
                url: url,
                responseType: 'arraybuffer'
            }));
        }
    }

    return new SoundCloud();
}