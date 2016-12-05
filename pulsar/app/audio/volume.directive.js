'use strict';
/**
 * Created by Greg on 12/4/2016.
 */

require('angular')
    .module('pulsar.audio')
    .directive('apVolume', ['$timeout', 'mallet.MouseUtils', apVolumeDirective]);

function apVolumeDirective($timeout, MouseUtils){
    return {
        restrict: 'E',
        replace: true,
        scope: {
            player: '='
        },
        templateUrl: 'views/volume.html',
        controller: ['$scope', '$element', function($scope, $element){
            var gain = 0.5;

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

            $scope.getGain = function(){
                return gain;
            };

            $scope.setGain = function(e){
                var volumeBar = $element[0].querySelector('.volume-bar'),
                    mouse = MouseUtils.getElementCoords(e, volumeBar);
                gain = mouse.x / volumeBar.clientWidth;
                $scope.player.setOutputGain(gain);
            };
        }]
    };
}