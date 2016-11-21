/**
 * Created by gjr8050 on 11/11/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar.warp').controller('warp.GameController', [
        'mallet.state',
        'warp.State',
        'MScheduler',
        'MKeyboard',
        'MKeys',
        'warp.LevelLoader',
        'AudioPlayer',
        'MediaLibrary',
        'WarpFieldDraw',
        'AutoPlay',
        GameController]);

    function GameController(MState, State, MScheduler, MKeyboard, MKeys, LevelLoader, AudioPlayer, AudioClip, WarpFieldDraw, AutoPlay){
        WarpFieldDraw.init();
        MScheduler.suspendOnBlur(); //Suspend the event loop when the window is blurred
        AudioPlayer.registerPlayer(); //init the audio player service
        AudioClip.getClipList() //wait for clips to load
            .then(AudioClip.loadAudioClips)
            .then(function() {
                LevelLoader.playClip(AutoPlay);
            });

        //Setup state events
        MState.onState(MState.Suspended, () => {
            if(State.is(State.Playing)){
                State.current = State.Paused;
                AudioPlayer.pause();
            }
        });

        MState.onState(MState.Running, () => {
            if(State.is(State.Paused)){
                State.current = State.Playing;
                AudioPlayer.resume();
            }
        });

        MKeyboard.onKeyDown(MKeys.Escape, () => { //Escape key toggles playing
            if(State.is(State.Playing) || State.is(State.Paused)) {
                MState.is(MState.Running) ? MScheduler.suspend() : MScheduler.resume()
            }
        });
    }
})();