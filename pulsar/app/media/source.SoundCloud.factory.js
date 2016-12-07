/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
'use strict';
require('angular').module('pulsar.media').factory('media.source.SoundCloud', [
    'media.Source',
    'simple-request.HttpConfig',
    sourceSoundCloudFactory
]);

function sourceSoundCloudFactory(Source, HttpConfig){

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
                    reqUrl += ``;
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
            return super.search(params);
        }


        getRawBuffer(sourceId) {
            var url = this._getRequestUrl('track', {trackId: sourceId});
            // Example SoundCloud URI (using proxy script)
            // http://thunderlab.net/pulsar-media/api/soundcloud/tracks/231543423
            return Source._queueRequest(new HttpConfig({
                url: url
            })).then(streamUrl => {
                return super.getRawBuffer(new HttpConfig({
                    url: streamUrl,
                    responseType: 'arraybuffer'
                }));
            });
        }
    }

    return SoundCloud;
}