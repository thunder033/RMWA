'use strict';
/**
 * Created by Greg on 12/4/2016.
 */

require('angular')
    .module('pulsar.audio')
    .directive('apVolume', ['$timeout', apVolumeDirective]);

function apVolumeDirective($timeout){
    return {
        restrict: 'E',
        replace: true,
        scope: {
            player: '='
        },
        templateUrl: 'views/volume.html',
        controller: ['$scope', function($scope){
            $scope.toggleMute = () => {
                $scope.muted = !$scope.muted;
                localStorage.setItem('pulsar-muted', $scope.muted === true ? '1' : '0');
                $scope.player.setOutputGain($scope.muted ? 0 : 1);
            };
            var cachedMute = parseInt(localStorage.getItem('pulsar-muted') || '0');
            $scope.muted = cachedMute === 1;

            if($scope.muted){
                $timeout(()=>  $scope.player.setOutputGain(0));
            }
        }]
    };
}