/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
'use strict';
require('angular').module('pulsar.media').factory('media.source.SoundCloud', [
    'media.Source',
    sourceSoundCloudFactory
]);

function sourceSoundCloudFactory(Source){

    class SoundCloud extends Source {

        constructor() {
            super('SoundCloud');
        }


        search(params) {
            return super.search(params);
        }


        getRawBuffer(config) {
            return super.getRawBuffer(config);
        }
    }

    return SoundCloud;
}