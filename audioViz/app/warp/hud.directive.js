/**
 * Created by Greg on 10/29/2016.
 */
"use strict";
angular.module('pulsar.warp').directive('warpHud', ['warp.State','MScheduler', 'AudioPlayer', 'warp.Ship', 'warp.LevelLoader', '$sce', '$timeout', function(WarpState, MScheduler, AudioPlayer, ship, LevelLoader, $sce, $timeout){
    return {
        restrict: 'E',
        templateUrl: 'views/warp-hud.html',
        link: function(scope){
            scope.warpState = WarpState;
            scope.player = AudioPlayer;
            scope.warp = ship;

            scope.toTrusted = function(html){
                return $sce.trustAsHtml(html);
            };

            scope.resume = () => {
                MScheduler.resume();
            };

            scope.playClip = clipId => {
                MScheduler.resume();
                LevelLoader.playClip(clipId)
            };

            scope.toggleMute = () => {
                scope.muted = !scope.muted;
                localStorage.setItem('warp-muted', scope.muted === true ? '1' : '0');
                AudioPlayer.setOutputGain(scope.muted ? 0 : 1);
            };
            var cachedMute = parseInt(localStorage.getItem('warp-muted') || '0');
            scope.muted = cachedMute === 1;

            if(scope.muted){
                $timeout(()=>  AudioPlayer.setOutputGain(0));
            }

        }
    }
}]);