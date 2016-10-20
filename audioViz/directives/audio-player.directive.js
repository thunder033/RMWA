/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.directive('audioPlayer', function(AudioPlayerService){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/audio-player.html',
        link: function(scope){
            AudioPlayerService.registerPlayer();
            scope.player = AudioPlayerService;
            scope.getPlaybarSize = function(){
                return AudioPlayerService.completionPct * 100 + '%'
            }
        }
    }
});