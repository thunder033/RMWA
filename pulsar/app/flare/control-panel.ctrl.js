"use strict";
/**
 * Created by gjrwcs on 9/15/2016.
 */
angular.module('pulsar.flare').controller('ControlPanelCtrl', function($scope, $timeout, MediaLibrary, AutoPlay, AudioPlayer, MediaState){
    //Ensure all components render before we start trying to load songs
        $timeout(()=>{
            MediaLibrary.getClipList()
                .then(MediaLibrary.loadAudioClips)
                //Were using the progress event so we don't wait for everything to load
                .then(null, null, function(clip){
                    //Play AutoPlay clip when it finishes loading
                    if(clip.name == AutoPlay && clip.state == MediaStates.READY)
                        AudioPlayer.playClip(AutoPlay);
                });
        });
});