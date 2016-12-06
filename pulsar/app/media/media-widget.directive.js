'use strict';
/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular')
    .module('pulsar.media')
    .directive('psMediaWidget', [
        mediaWidgetDirective
    ]);

function mediaWidgetDirective(){
    return {
        restrict: 'E',
        templateUrl: 'views/media-widget.html',
        replace: true,
        scope: {
            queue: '='
        },
        link: function(){

        },
        controller: ['$scope', 'media.PlayQueue', 'media.Playlist', 'media.const.Type', 'media.Library', function ($scope, PlayQueue, Playlist, MediaType, MediaLibrary) {

            $scope.playlist = new Playlist();

            //Retrieve initial set of songs from the media library
            MediaLibrary.isReady()
                .then(() => MediaLibrary.getAudioClips(MediaType.Song))
                .then(clips => $scope.playlist.setItems(clips));

            $scope.queueOptions = [
                {value: PlayQueue.PlayNext, name: 'Play Next', icon: ''},
                {value: PlayQueue.PlayNow, name: 'Play Now', icon: ''},
                {value: PlayQueue.QueueEnd, name: 'Add to Queue', icon: ''},
            ];

            $scope.model = {
                queueMode: PlayQueue.PlayNext
            };

            $scope.queueClip = function (clip) {
                $scope.queue.addItem(clip, $scope.model.queueMode);
            };
        }]
    };
}