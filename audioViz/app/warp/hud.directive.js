/**
 * Created by Greg on 10/29/2016.
 */
"use strict";
angular.module('pulsar-warp').directive('warpHud', ['MApp','MState','MScheduler', 'AudioPlayerService', function(MApp, MState, MScheduler, AudioPlayer){
    return {
        restrict: 'E',
        templateUrl: 'views/warp-hud.html',
        link: function(scope){
            scope.mApp = MApp;
            scope.mState = MState;
            scope.player = AudioPlayer;

            scope.score = 0;

            scope.resume = () => {
                MScheduler.resume();
            }
        }
    }
}]);