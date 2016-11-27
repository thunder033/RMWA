/**
 * Created by gjr8050 on 11/16/2016.
 */
angular.module('pulsar.media', [])
    .run(['media.Library', function (MediaLibrary) {
        MediaLibrary.init();
}]);