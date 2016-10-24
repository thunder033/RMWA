/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.service('AudioClipService', function ($http, $q, MediaPath, MediaStates, ReverbImpulsePath, MediaType) {
    var self = this,
        clips = {},
        clipList = [],
        clipCache = {},
        autoIncrementID = 0;

    /**
     * Push out new set of clips to any clients that have requested a filtered list of clips
     */
    function updateCaches() {
        Object.keys(clipCache).forEach(function (clipType) {
            clipCache[clipType].length = 0;
            Array.prototype.push.apply(clipCache[clipType], clipList.filter(clip => clip.type == clipType));

            //This is so hacky its not even funny, but its the best I got right now
            if(clipType === MediaType.ReverbImpulse){
                clipCache[clipType].push({name: 'None', id: 9999});
            }
        });
    }

    /**
     * Retrieves a list of audio clips to load
     * @returns {Promise}
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
            {name: 'Bass Boost.wav', type: MediaType.ReverbImpulse}
        ]);
    };

    /**
     * Load a series of clips into the audio clip service
     * @param clipList
     * @returns {Promise|IPromise}
     */
    this.loadAudioClips = (clipList) => {
        clipList = clipList instanceof Array ? clipList : [clipList];
        var defer = $q.defer();

        $q.all(clipList.map(fileName=> {
            return self.loadAudioClip(fileName.name || fileName, fileName.type || MediaType.Clip).then(defer.notify);
        })).then(defer.resolve, defer.reject);

        return defer.promise.then(updateCaches);
    };

    /**
     * Derive a more readable name from a file name
     * @param fileName
     * @returns {string}
     */
    this.getNiceName = (fileName) => {
        var pcs = fileName.split('.');
        pcs.pop();
        return pcs.join('.');
    };

    /**
     * load a given audio clip into the audio clip service
     * @param fileName
     * @param type
     * @returns {Promise.<Object>|IPromise<TResult>|*}
     */
    this.loadAudioClip = (fileName, type) => {
        var uri = (type == 'reverbImpulse' ? ReverbImpulsePath : MediaPath) + fileName,
            id = autoIncrementID++;

        clips[id] = {
            id: id,
            name: self.getNiceName(fileName),
            uri: uri,
            state: MediaStates.LOADING,
            clip: null,
            type: type
        };

        clipList.push(clips[id]);
        clipList.sort((a, b) => a.id > b.id);

        //Were going to preload the audio clips so there's no delay in playing
        return $http.get(uri, {responseType: 'arraybuffer'}).then(function (clip) {
            clips[id].state = MediaStates.READY;
            clips[id].clip = clip.data;
            return clips[id];
        }, function (err) {
            //console.warn(fileName + ' failed to load: ' + (err.message || err));
            clips[id].state = MediaStates.ERROR;
            return clips[id];
        });
    };

    /**
     * Return the audio clip with the given id or name
     * @param id
     * @returns {*}
     */
    this.getAudioClip = (id) => {
        if (typeof id == "number") {
            return clips[id];
        }
        else if (typeof id == "string") {
            return clipList.reduce((clip, curClip) => {
                return !clip && curClip.name == id ? curClip : clip;
            }, null);
        }

    };

    /**
     * Get all audio clips of one type
     * @param type
     * @returns {*}
     */
    this.getAudioClips = (type) => {
        if (type) {
            if(!clipCache[type]){
                clipCache[type] = clipList.filter(clip => clip.type == type);
            }

            return clipCache[type];
        }

        return clipList;
    };
});