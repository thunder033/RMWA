/**
 * Created by gjr8050 on 9/16/2016.
 */
'use strict';
require('angular').module('pulsar.flare').directive('audioPlayer', ['audio.Player', '$sce', '$timeout', function(AudioPlayer, $sce, $timeout){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/audio-player.html',
        link: function(scope, elem){
            scope.player = AudioPlayer;
            scope.getPlaybarSize = function(){
                return AudioPlayer.completionPct * 100 + '%';
            };

            scope.toTrusted = function(html){
                return $sce.trustAsHtml(html);
            };

            scope.toggleMute = () => {
                scope.muted = !scope.muted;
                localStorage.setItem('pulsar-muted', scope.muted === true ? '1' : '0');
                AudioPlayer.setOutputGain(scope.muted ? 0 : 1);
            };
            var cachedMute = parseInt(localStorage.getItem('pulsar-muted') || '0');
            scope.muted = cachedMute === 1;

            if(scope.muted){
                $timeout(()=>  AudioPlayer.setOutputGain(0));
            }
            
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