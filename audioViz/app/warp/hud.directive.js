/**
 * Created by Greg on 10/29/2016.
 */
"use strict";
angular.module('pulsar-warp').directive('warpHud', ['WarpState','MScheduler', 'AudioPlayerService', 'warp.ship', 'Warp', function(WarpState, MScheduler, AudioPlayer, ship, Warp){
    return {
        restrict: 'E',
        templateUrl: 'views/warp-hud.html',
        link: function(scope){
            scope.warpState = WarpState;
            scope.player = AudioPlayer;
            scope.warp = ship;

            scope.resume = () => {
                MScheduler.resume();
            };

            scope.playClip = clipId => {
                MScheduler.resume();
                Warp.playClip(clipId)
            }
        }
    }
}]);