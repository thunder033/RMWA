/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.service('AudioClipService', function($http, $q){

        var clips = {},
            autoIncrementID = 0;

        var audioClipService = {
            loadAudioClips(uriList){
                uriList = uriList instanceof Array ? uriList : [uriList];
                $q.all(uriList.map(audioClipService.loadAudioClip));
            },
            loadAudioClip(uri){
                $http.get(uri, {headers: {'Content-Type': 'arraybuffer'}}).then(function(clip){
                    var id = autoIncrementID++;

                    clips[id] = {
                        id: id,
                        name: null,
                        clip: clip
                    };

                    return clip;
                }, function(err){
                    console.log(err);
                });
            },
            getAudioClip(id){
                return clips[id];
            }
        };

        return audioClipService;
    });