/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('MediaPath', 'assets/audio/')
    .constant('MediaStates', Object.freeze({
        READY: 'READY',
        LOADING: 'LOADING',
        ERROR: 'ERROR'
    }))
    .service('AudioClipService', function($http, $q, MediaPath, MediaStates){

        var clips = {},
            clipList = [],
            autoIncrementID = 0;

        var audioClipService = {
            loadAudioClips(uriList){
                uriList = uriList instanceof Array ? uriList : [uriList];
                var defer = $q.defer();

                $q.all(uriList.map(fileName=>{
                    return audioClipService.loadAudioClip(fileName).then(defer.notify);
                })).then(defer.resolve, defer.reject);

                return defer.promise;
            },
            getNiceName(fileName){
                var pcs =  fileName.split('.');
                pcs.pop();
                return pcs.join('.');
            },
            loadAudioClip(fileName){
                var uri = MediaPath + fileName,
                    id = autoIncrementID++;

                clips[id] = {
                    id: id,
                    name: audioClipService.getNiceName(fileName),
                    uri: uri,
                    state: MediaStates.LOADING,
                    clip: null
                };

                clipList.push(clips[id]);
                clipList.sort((a, b) => a.id > b.id);

                //Were going to preload the audio clips so there's no delay in playing
                return $http.get(uri, {headers: {'Content-Type': 'arraybuffer'}}).then(function(clip){
                    clips[id].state = MediaStates.READY;
                    return clips[id];
                }, function(err){
                    console.log(err);
                    return clips[id];
                });
            },
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
            getAudioClips() {
                return clipList;
            }
        };

        return audioClipService;
    });