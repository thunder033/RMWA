/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
angular.module('pulsar-visualizer').directive('playlist', function(AudioClipService, AudioPlayerService, MediaType){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/playlist.html',
        link: function(scope){
            scope.clips = AudioClipService.getAudioClips(MediaType.Song);

            scope.playClip = function(clipId) {
                AudioPlayerService.playClip(clipId);
            };

            scope.isPlaying = function(clipId) {
                return (AudioPlayerService.playing || {}).id == clipId;
            };
        }
    }
});