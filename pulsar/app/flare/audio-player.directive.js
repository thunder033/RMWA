/**
 * Created by gjr8050 on 9/16/2016.
 */
'use strict';
require('angular').module('pulsar.flare').directive('audioPlayer', ['audio.Player', function(AudioPlayer){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/audio-player.html',
        link: function(scope, elem){
            scope.player = AudioPlayer;
            scope.getPlaybarSize = function(){
                return AudioPlayer.completionPct * 100 + '%';
            };
            
            function getMouse(e){
                var mouse = {}; // make an object
                mouse.x = e.pageX - e.target.offsetLeft;
                mouse.y = e.pageY - e.target.offsetTop;
                return mouse;
            }
            
            scope.seek = function(e){
                var mouse = getMouse(e),
                    playBar = elem[0].querySelector('.play-bar'),
                    pctPos = mouse.x / playBar.clientWidth;
                AudioPlayer.seekTo(pctPos);
            };
        }
    };
}]);