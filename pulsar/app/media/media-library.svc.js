/**
 * Created by gjr8050 on 9/16/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar.media').service('media.Library', [
        '$http',
        '$q',
        'media.Path',
        'media.State',
        'media.Type',
        'media.AudioClip',
        'media.Source',
        'media.Sources',
        '$injector',
        Library]);

    function Library($http, MediaPath, MediaState, MediaType, AudioClip, Source, Sources, $injector) {
        var self = this,
            ready = $q.defer(),
            loadingTriggered = false,
            clips = {},
            clipList = [],
            clipCache = {};

        function init() {
            //Invoke the creation of each source
            Object.keys(Sources).forEach(source => $injector.get(`media.source.${source}`));
        }

        /**
         * Push out new set of clips to any clients that have requested a filtered list of clips
         */
        function updateCaches() {
            Object.keys(clipCache).forEach(function (clipType) {
                clipCache[clipType].length = 0;
                Array.prototype.push.apply(clipCache[clipType], clipList.filter(clip => clip.type == clipType));
            });
        }

        /**
         * Retrieves a list of audio clips to load
         * @returns {Promise<Array>}
         */
        this.getClipList = () => {
            return $q.when([
                //Audio clips from local machine
                'Kitchen Sink.mp3',
                'Hallelujah.wav',
                'Be Concerned.mp3',
                'Trees.mp3',
                'Panic Station.mp3',
                'Secrets.mp3',
                'Undisclosed Desires.mp3',
                'Beam (Orchestral Remix).mp3',
                'Remember the name.mp3',
                //Class Provided Samples
                'New Adventure Theme.mp3',
                'Peanuts Theme.mp3',
                'The Picard Song.mp3',

                //Impulse samples: Samplicity (http://www.samplicity.com/bricasti-m7-impulse-responses/)
                {name: 'Concert Hall.wav', type: MediaType.ReverbImpulse},
                {name: 'Arena.wav', type: MediaType.ReverbImpulse},
                {name: 'Bass Boost.wav', type: MediaType.ReverbImpulse},

                {name: 'gemCollect.wav', type: MediaType.Effect},
                {name: 'blackGem.wav', type: MediaType.Effect}
            ]);
        };

        /**
         * Returns promise that resolves when the clips have been loaded
         * @returns {Promise}
         */
        this.isReady = () => {
            return ready.promise;
        };

        /**
         * Load a series of clips into the audio clip service
         * @param clipList
         * @returns {Promise|IPromise}
         */
        this.loadAudioClips = (clipList) => {
            //TODO: Make this less clunky...
            if(loadingTriggered){
                return ready.promise;
            }

            loadingTriggered = true;

            clipList = clipList instanceof Array ? clipList : [clipList];

            $q.all(clipList.map(fileName=> {
                return self.loadAudioClip(fileName.name || fileName, fileName.type || MediaType.Song).then(ready.notify);
            })).then(ready.resolve, ready.reject);

            return ready.promise.then(updateCaches)
        };

        /**
         * load a given audio clip into the audio clip service
         * @param {string} fileName
         * @param {media.Type} type
         * @returns {Promise.<AudioClip>|IPromise<AudioClip>|*}
         */
        this.loadAudioClip = (fileName, type) => {
            var uri = (type == MediaType.ReverbImpulse ? MediaPath.ReverbImpulse : MediaPath.Base) + fileName,
                clip = new AudioClip({
                    name: fileName,
                    uri: uri,
                    type: type
                });

            clips[clip.id] = clip;

            clipList.push(clip);
            clipList.sort((a, b) => a.id > b.id);

            //Were going to preload the audio clips so there's no delay in playing
            return $http.get(uri, {responseType: 'arraybuffer'}).then(function (buffer) {
                clip.state = MediaState.Ready;
                clip.clip = buffer.data;
                return clip;
            }, function (err) {
                //console.warn(fileName + ' failed to load: ' + (err.message || err));
                clip.state = MediaState.Error;
                return clip;
            });
        };

        /**
         * Return the audio clip with the given id or name
         * @param id {string|number}
         * @returns {Promise<AudioClip>}
         */
        this.getAudioClip = (id) => {
            return ready.promise.then(()=>{
                if (typeof id === "number") {
                    return clips[id];
                }
                else if (typeof id === "string") {
                    return clipList.reduce((clip, curClip) => {
                        return !clip && curClip.name === id ? curClip : clip;
                    }, null);
                }
            });
        };

        /**
         * Get all audio clips of one type
         * @param type {media.Type}
         * @returns {Promise<AudioClip[]>}
         */
        this.getAudioClips = (type) => {
            return ready.promise.then(()=>{
                if (type) {
                    if(!clipCache[type]){
                        clipCache[type] = clipList.filter(clip => clip.type == type);
                    }

                    return clipCache[type];
                }

                return clipList;
            });
        };
    }
})();