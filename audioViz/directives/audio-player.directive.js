/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.directive('audioPlayer', function(AudioPlayerService){

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/audio-player.html',
        link: function(scope, elem){
            //Connect the audio element to the player service
            AudioPlayerService.registerPlayer(elem[0].querySelector('audio'));

            var states = {
                LOADING: 'LOADING',
                PLAYING: 'PLAYING',
                PAUSED: 'PAUSED',
                STOPPED: 'STOPPED',
                ERROR: 'ERROR'
            };

            scope.state = states.LOADING
        }
    }
});