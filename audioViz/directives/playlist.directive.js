/**
 * Created by Greg on 9/18/2016.
 */
"use strict";
app.directive('playlist', function(AudioClipService, AudioPlayerService){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/playlist.html',
        link: function(scope, elem){
            scope.clips = AudioClipService.getAudioClips();

            scope.playClip = function(clipId) {
                AudioPlayerService.playClip(clipId);
            };

            scope.isPlaying = function(clipId) {
                return (AudioPlayerService.playing || {}).id == clipId;
            };
        }
    }
});