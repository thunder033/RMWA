/**
 * Created by Greg on 9/18/2016.
 */
(()=>{
    "use strict";
    angular.module('pulsar.flare').directive('playlist', [
        'audio.Player',
        'media.Library',
        'media.const.Type',
        playlistDirective]);

    function playlistDirective(AudioPlayer, MediaLibrary, MediaType){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                actionOverride: '='
            },
            templateUrl: 'views/playlist.html',
            link: function(scope){
                scope.clips = null;
                scope.clipList = [];
                //Retrieve songs from the media library
                MediaLibrary.getAudioClips(MediaType.Song)
                    .then(clips => scope.clips = clips);

                scope.playClip = function(clip) {
                    AudioPlayer.playClip(clip);
                };

                scope.getPage = function(page, clipQueue, clipList) {
                    if(!clipQueue || typeof page !== 'number'){
                        return [];
                    }

                    clipList.length = 0;

                    var pageSize = 10, pos = 0;
                    var it = clipQueue.getIterator();
                    while(!it.isEnd() && pos <= (page + 1) * pageSize){
                        if(pos++ > page * pageSize){
                            clipList.push(it.next());
                        }
                        else {
                            it.next();
                        }
                    }

                    return clipList;
                };

                if(scope.actionOverride instanceof Function){
                    scope.playClip = scope.actionOverride;
                }


                scope.isPlaying = function(clipId) {
                    return typeof clipId === 'number' && (AudioPlayer.playing || {}).id == clipId;
                };
            }
        }
    }
})();
