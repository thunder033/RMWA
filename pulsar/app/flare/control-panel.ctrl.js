'use strict';
/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular').module('pulsar.flare').controller('ControlPanelCtrl', [
    '$scope',
    'media.Library',
    'audio.Player',
    'media.const.State',
    'media.PlayQueue',
    ControlPanelCtrl]);

function ControlPanelCtrl($scope, MediaLibrary, AudioPlayer, MediaState, PlayQueue){
    MediaLibrary.isReady().then(()=>{
        AudioPlayer.stop();
    });

    $scope.player = AudioPlayer;
    $scope.playQueue = new PlayQueue(AudioPlayer);

    $scope.queueClip = function (clip) {
        $scope.playQueue.addItem(clip);
    };
}
