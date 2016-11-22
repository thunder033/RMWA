/**
 * Created by Greg on 11/21/2016.
 */
(()=>{
    "use strict";
    angular.module('pulsar.media').factory('media.source.Local', [
        'media.Source',
        'mallet.AsyncRequest',
        'simple-http.HttpConfig',
        'media.AudioClip',
        'media.Type',
        'media.Path',
        sourceLocalFactory]);

    /**
     * @returns {Local}
     */
    function sourceLocalFactory(Source, AsyncRequest, HttpConfig, AudioClip, MediaType, MediaPath){

        /**
         * @extends Source
         */
        class Local extends Source {
            constructor() {
                super('Local');
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
                        var fileName = track.name || track,
                            url = (type === MediaType.ReverbImpulse ? MediaPath.ReverbImpulse : MediaPath.Base) + fileName;

                        //Load the local track into the cache
                        this._cachedTracks.push(new AudioClip({
                            source: this,
                            name: fileName,
                            type: track.type || MediaType.Song,
                            url: url
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
                switch(params.field)
                {
                    case 'name':
                        //TODO: implement name searching
                        return this._cachedTracks.filter(track => track.name === params.term);
                        break;
                    case 'type':
                        return this._cachedTracks.filter(track => track.type === params.term);
                        break;
                    default:
                        return this._cachedTracks;
                }
            }

            /**
             * Loads the audio data for the given track
             * @param {string|number} sourceId
             */
            getRawBuffer(sourceId) {
                var track = this.getTrack(sourceId);

                return super.getRawBuffer(new HttpConfig({
                    url: track.url,
                    responseType: 'arraybuffer'
                }));
            }
        }

        return new Local();
    }
});