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
            AudioPlayerService.registerPlayer();
            scope.player = AudioPlayerService;
            scope.getPlaybarSize = function(){
                return AudioPlayerService.completionPct * 100 + '%'
            }
            
            function getMouse(e){
                var mouse = {} // make an object
                mouse.x = e.pageX - e.target.offsetLeft;
                mouse.y = e.pageY - e.target.offsetTop;
                return mouse;
            }
            
            scope.seek = function(e){
                var mouse = getMouse(e),
                    playBar = elem[0].querySelector(".play-bar"),
                    pctPos = mouse.x / playBar.clientWidth;
                AudioPlayerService.seekTo(pctPos);
            }
        }
    }
});