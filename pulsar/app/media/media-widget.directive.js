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
                queueMode: PlayQueue.PlayNext,
                search: '',
            };

            /**
             * Add a clip to the play queue the the user-selected queue mode
             * @param clip
             */
            $scope.queueClip = function (clip) {
                $scope.queue.addItem(clip, $scope.model.queueMode);
            };

            /**
             * Execute a search of the media library
             */
            $scope.search = function(){
                if($scope.model.search.length === 0){
                    return MediaLibrary.getAudioClips(MediaType.Song)
                        .then(clips => $scope.playlist.setItems(clips));
                }

                MediaLibrary.searchByName($scope.model.search).then(null, null, results => {
                    $scope.playlist.setItems(results);
                });
            };

            $scope.$watch('model.search', $scope.search);
        }]
    };
}