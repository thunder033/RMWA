'use strict';
/**
 * Handles requests to the Groove API endpoint
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular').module('pulsar.media').factory('media.source.Groove', [
    'media.Source',
    'simple-request.HttpConfig',
    'media.AudioClip',
    'media.const.Type',
    sourceGrooveFactory
]);

function sourceGrooveFactory(Source, HttpConfig, AudioClip, MediaType){

    function trackCompare(a, b)
    {
        return parseInt(a.playback_count) > parseInt(b.playback_count) ? -1 : 1;
    }

    function getTracks(result) {
        return result.Tracks.Items;
    }

    function getArtistString(artists) {
        return artists.map(artist => artist.Artist.Name).join(', ');
    }

    class Groove extends Source {

        constructor(){
            super('Groove');
            this.apiUrl = 'http://thunderlab.net/pulsar-media/api/groove/';
        }

        search(params) {
            if(params.term === '' || params.field !== 'name'){
                return super.search(params);
            }

            var url = this.getRequestUrl('search', {term: params.term});

            return Source.queueRequest(HttpConfig.get(url))
                .then(getTracks)
                .then(results => {
                    //Parse each track in the list
                    return results.sort(trackCompare).map(track => {
                        //Load the local track into the cache
                        return new AudioClip({
                            source: this,
                            sourceId: track.Id,
                            name: track.Name,
                            type: MediaType.Song,
                            artist: getArtistString(track.Artists),
                            deepLink: track.Link,
                            album: track.Album.Name,
                            uri: `${this.apiUrl}/track?id=${track.Id}`
                        });
                    });
                });
        }

        getRawBuffer(sourceId) {
            var url = this.getRequestUrl('track', {trackId: sourceId});
            // Example SoundCloud URI (using proxy script)
            // http://thunderlab.net/pulsar-media/api/soundcloud/tracks/231543423
            return super.getRawBuffer(new HttpConfig({
                url: url,
                responseType: 'arraybuffer'
            }));
        }
    }

    return new Groove();
}