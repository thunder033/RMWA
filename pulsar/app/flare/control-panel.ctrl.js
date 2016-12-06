'use strict';
/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular').module('pulsar.flare').controller('ControlPanelCtrl', [
    '$scope',
    'media.Library',
    'audio.Player',
    'media.PlayQueue',
    '$timeout',
    ControlPanelCtrl]);

function ControlPanelCtrl($scope, MediaLibrary, AudioPlayer, PlayQueue, $timeout){

    MediaLibrary.isReady().then(()=>{
        AudioPlayer.stop();
    });

    $scope.playQueueAdded = ''; //The title of the last added song
    $scope.notifcationEvent = null; //Handle to the timeout event (hiding the notification)
    
    $scope.player = AudioPlayer;
    $scope.playQueue = new PlayQueue(AudioPlayer);

    $scope.isActiveNotification = function(){
        return $scope.playQueueAdded !== '' && $scope.playQueueAdded !== null;
    };

    $scope.playQueue.addEventListener('itemAdded', e =>{
        if(!e.item){
            return;
        }

        //Get the name of added item
        $scope.playQueueAdded = e.item.getName();

        // cancel out the previous notification hide event
        if($scope.notifcationEvent !== null){
            $timeout.cancel($scope.notifcationEvent);
        }

        //Make the notification disappear after a delay
        $scope.notifcationEvent = $timeout(()=>{
            $scope.playQueueAdded = null;
            $scope.notifcationEvent = null;
        }, 1500);
    });
}
