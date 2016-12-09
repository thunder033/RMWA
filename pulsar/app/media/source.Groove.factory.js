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
    'adalAuthenticationService',
    '$rootScope',
    sourceGrooveFactory
]);

function sourceGrooveFactory(Source, HttpConfig, AudioClip, MediaType, adalAuth, $rootScope){

    $rootScope.$on('adal:loginSuccess', function () {
        console.log('ms success');
        //$scope.testMessage = "loginSuccess";
    });


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
            // optional
            if(params.term === '' || params.field !== 'name'){
                return super.search(params);
            }

            console.log($rootScope.userInfo);
            if(!$rootScope.userInfo || !$rootScope.userInfo.isAuthenticated){
                adalAuth.login();
            }
            else {
                console.log('getting a token');
                adalAuth.acquireToken('http://music.xboxlive.com', function(token){
                    console.log('got a token');
                    console.log(token);
                });
            }

            var url = this.getRequestUrl('search', {term: params.term});

            /**
             * http://localhost:63342/RMWA/pulsar/index.html#
             * id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlJyUXF1OXJ5ZEJWUldtY29jdVhVYjIwSEdSTSIsImtpZCI6IlJyUXF1OXJ5ZEJWUldtY29jdVhVYjIwSEdSTSJ9.eyJhdWQiOiI1ZTI4OTcxMS1hZDMwLTQ3YzQtOWJlOC1lMTdhNDMyNWExNDMiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC85MTg4MDQwZC02YzY3LTRjNWItYjExMi0zNmEzMDRiNjZkYWQvIiwiaWF0IjoxNDgxMjU4NDQ1LCJuYmYiOjE0ODEyNTg0NDUsImV4cCI6MTQ4MTI2MjM0NSwiYW1yIjpbInB3ZCJdLCJlbWFpbCI6ImNyYXNodGVzdDFAbGl2ZS5jb20iLCJmYW1pbHlfbmFtZSI6IlJvem1hcnlub3d5Y3oiLCJnaXZlbl9uYW1lIjoiR3JlZyIsImlkcCI6ImxpdmUuY29tIiwiaXBhZGRyIjoiMTI5LjIxLjI4LjM2IiwibmFtZSI6IkdyZWcgUm96bWFyeW5vd3ljeiIsIm5vbmNlIjoiN2VlYTI0NDQtNzIxZC00MzM5LWE3OWItODIzNTZkNjFmMjY0Iiwib2lkIjoiMGEzNzY2OTMtOGRhZS00NjU2LWE4OTYtYjBkY2M0NTU1ZDQwIiwicGxhdGYiOiIzIiwic3ViIjoiZFpHby1oRWF5ekdUNUprTzlwb0pCN295S29raWZ5QjZxWjd0NHZtSGYyQSIsInRpZCI6IjkxODgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsInVuaXF1ZV9uYW1lIjoibGl2ZS5jb20jY3Jhc2h0ZXN0MUBsaXZlLmNvbSIsInZlciI6IjEuMCJ9.QvvYdqAr4YfHgBsoUdoEFtaX2ayNB-ZtFjSWKTaVpPS6sdaRqYdpMb3LIdhCZfRfGxd-jK2VmehJ8rTcXtkxirXMcNtVXILBAYcJYJwz2jydyO54YGG6OGByF8DoQcXOJLjlSr8nf87ZnwecpqQuMKOwSI4NU78JQv3GipxLSpsAKlxRotxsJ-O9XUkwmiQzHSzvUsYJmO8Pc3e-o9v1rVy738N_R22_aNzyVXFDGtON_6LxV31tgXMSZNSd8yOErOkBn1iOk7rRFSEZQrsl-MMS6_3ELlXCpyJwgP3Q7O-QGSHTIxFhJI-87Wifm0gi6iku8B9vdzlxdCSxnQvn8g
             * &state=1b1459a6-e437-464e-b1e3-05b55a0dae2a
             * &session_state=2abdd3b8-c409-4e7a-b38e-6a4814f81a22
             */
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
                            uri: `${this.apiUrl}/tracks/${track.Id}/stream`
                        });
                    });
                });
        }

        getRawBuffer(sourceId) {
            var url = this.getRequestUrl('track', {trackId: sourceId});
            // Example SoundCloud URI (using proxy script)
            // http://thunderlab.net/pulsar-media/api/soundcloud/tracks/231543423
            return super.getRawBuffer(new HttpConfig({
                queryParams: {
                    authToken: '',
                    clientInstanceId: ''
                },
                url: url,
                responseType: 'arraybuffer'
            }));
        }
    }

    return new Groove();
}