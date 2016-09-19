/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.constant('MediaPath', 'assets/audio/')
    .service('AudioClipService', function($http, $q, MediaPath){

        var clips = {},
            clipList = [],
            autoIncrementID = 0;

        var audioClipService = {
            loadAudioClips(uriList){
                uriList = uriList instanceof Array ? uriList : [uriList];
                return $q.all(uriList.map(audioClipService.loadAudioClip));
            },
            getNiceName(fileName){
                var pcs =  fileName.split('.');
                pcs.pop();
                return pcs.join('.');
            },
            loadAudioClip(fileName){
                var uri = MediaPath + fileName;

                //Were going to preload the audio clips so there's no delay in playing
                return $http.get(uri, {headers: {'Content-Type': 'arraybuffer'}}).then(function(clip){
                    var id = autoIncrementID++;

                    clips[id] = {
                        id: id,
                        name: audioClipService.getNiceName(fileName),
                        uri: uri,
                        clip: clip
                    };

                    clipList.push(clips[id]);
                    clipList.sort((a, b) => a.clip.id > b.clip.id);

                    return clip;
                }, function(err){
                    console.log(err);
                    return {name: null};
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