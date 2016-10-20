"use strict";
/**
 * Created by gjrwcs on 9/15/2016.
 */
app.controller('ControlPanelCtrl', function($scope, $timeout, AudioClipService, AutoPlay, AudioPlayerService, MediaStates){
    //Ensure all components render before we start trying to load songs
        $timeout(()=>{
            AudioClipService.getClipList()
                .then(AudioClipService.loadAudioClips)
                //Were using the progress event so we don't wait for everything to load
                .then(null, null, function(clip){
                    //Play AutoPlay clip when it finishes loading
                    if(clip.name == AutoPlay && clip.state == MediaStates.READY)
                        AudioPlayerService.playClip(AutoPlay);
                });
        });
});