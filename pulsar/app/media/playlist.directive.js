/**
 * Created by Greg on 9/18/2016.
 */
(()=>{
    "use strict";
    
    angular.module('pulsar.media').directive('playlist', [
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

                // By default send a played clip to the audio player
                scope.playClip = function(clip) {
                    AudioPlayer.playClip(clip);
                };

                // Allow for clients to set an alternative action
                if(scope.actionOverride instanceof Function){
                    scope.playClip = scope.actionOverride;
                }

                /**
                 * Gets a subset of results from a clip queue
                 * @param {number} page
                 * @param {PriorityQueue} clipQueue
                 * @param {Array} clipList
                 * @returns {Array<AudioClip>}
                 */
                scope.getPage = function(page, clipQueue, clipList) {
                    // clear the clip list
                    clipList.length = 0;
                    // return an empty array if given an invalid page
                    if(!clipQueue || typeof page !== 'number'){
                        return clipList;
                    }

                    var pageSize = 10, pos = 0;
                    var it = clipQueue.getIterator();
                    // iterate through queue until end or page is filled
                    while(!it.isEnd() && clipList.length < pageSize){
                        if(pos++ > page * pageSize){
                            clipList.push(it.next());
                        }
                        else {
                            it.next();
                        }
                    }

                    return clipList;
                };

                scope.isPlaying = function(clipId) {
                    return typeof clipId === 'number' && (AudioPlayer.playing || {}).id == clipId;
                };
            }
        }
    }
})();