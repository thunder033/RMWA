/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('MediaPath', 'assets/audio/')
    .constant('ReverbImpulsePath', 'assets/reverb-impulses/')
    .constant('MediaStates', Object.freeze({
        READY: 'READY',
        LOADING: 'LOADING',
        ERROR: 'ERROR'
    }))
    .service('AudioClipService', function($http, $q, MediaPath, MediaStates, ReverbImpulsePath){

        var clips = {},
            clipList = [],
            autoIncrementID = 0;

        var audioClipService = {
            /**
             * Load a series of clips into the audio clip service
             * @param clipList
             * @returns {Promise}
             */
            loadAudioClips(clipList){
                clipList = clipList instanceof Array ? clipList : [clipList];
                var defer = $q.defer();

                $q.all(clipList.map(fileName=>{
                    return audioClipService.loadAudioClip(fileName.name || fileName, fileName.type || 'media').then(defer.notify);
                })).then(defer.resolve, defer.reject);

                return defer.promise;
            },
            /**
             * Derive a more readable name from a file name
             * @param fileName
             * @returns {string}
             */
            getNiceName(fileName){
                var pcs =  fileName.split('.');
                pcs.pop();
                return pcs.join('.');
            },
            /**
             * load a given audio clip into the audio clip service
             * @param fileName
             * @param type
             * @returns {Promise.<TResult>|IPromise<TResult>|*}
             */
            loadAudioClip(fileName, type){
                var uri = (type == 'reverbImpulse' ? ReverbImpulsePath : MediaPath) + fileName,
                    id = autoIncrementID++;

                clips[id] = {
                    id: id,
                    name: audioClipService.getNiceName(fileName),
                    uri: uri,
                    state: MediaStates.LOADING,
                    clip: null,
                    type: type
                };

                clipList.push(clips[id]);
                clipList.sort((a, b) => a.id > b.id);

                //Were going to preload the audio clips so there's no delay in playing
                return $http.get(uri, {responseType: 'arraybuffer'}).then(function(clip){
                    clips[id].state = MediaStates.READY;
                    clips[id].clip = clip.data;
                    return clips[id];
                }, function(err){
                    console.error(err);
                    clips[id].state = MediaStates.ERROR;
                    return clips[id];
                });
            },
            /**
             * Return the audio clip with the given id or name
             * @param id
             * @returns {*}
             */
            getAudioClip(id) {
                if(typeof id == "number"){
                    return clips[id];
                }
                else if(typeof id == "string"){
                    return clipList.reduce((clip, curClip) => {
                        return !clip && curClip.name == id ? curClip : clip;
                    }, null);
                }

            },
            /**
             * Get all audio clips of one type
             * @param type
             * @returns {*}
             */
            getAudioClips(type) {
                if(type){
                    return clipList.filter(clip => clip.type == type);
                }

                return clipList;
            }
        };

        return audioClipService;
    });