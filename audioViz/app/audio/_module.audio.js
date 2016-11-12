/**
 * Created by gjrwcs on 10/25/2016.
 */
angular.module('pulsar.audio', [])
    .run(['MediaLibrary',function (MediaLibrary) {
        MediaLibrary.getClipList()
            .then(MediaLibrary.loadAudioClips);
    }]);