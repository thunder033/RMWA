/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
angular.module('pulsar-visualizer').directive('playlist', function(AudioClipService, AudioPlayer, MediaType){
    return {
        restrict: 'E',
        replace: true,
        scope: {
            actionOverride: '='
        },
        templateUrl: 'views/playlist.html',
        link: function(scope){
            scope.clips = AudioClipService.getAudioClips(MediaType.Song);

            scope.playClip = function(clipId) {
                AudioPlayer.playClip(clipId);
            };

            if(scope.actionOverride instanceof Function){
                scope.playClip = scope.actionOverride;
            }


            scope.isPlaying = function(clipId) {
                return (AudioPlayer.playing || {}).id == clipId;
            };
        }
    }
});