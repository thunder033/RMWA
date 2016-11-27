/**
 * Created by gjrwcs on 9/15/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar.flare').directive('controlPanel', ['Flare','Effects','MScheduler','media.Library','audio.Player', 'media.const.Type', controlPanel]);

    function controlPanel(Visualizer, Effects, MScheduler, MediaLibrary, AudioPlayer, MediaType){
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/control-panel.html',
            link: function(scope){
                scope.reverbEffects = [];

                scope.visualizer = Visualizer;
                scope.effects = Effects;

                scope.reverbEffect = {name: 'None', id: 9999};
                MediaLibrary.getAudioClips(MediaType.ReverbImpulse)
                    .then(effects => {
                        scope.reverbEffects = effects.asArray();
                        scope.reverbEffects.push({name: 'None', id: 9999});
                    });

                scope.setCircleRadius = function(value){
                    Visualizer.setCircleRadius(value);
                };

                scope.setReverbEffect = function(){
                    if(scope.reverbEffect.name === 'None'){
                        AudioPlayer.disableConvolverNode();
                    }
                    else {
                        var clipData = MediaLibrary.getAudioClip(scope.reverbEffect.name).clip;
                        AudioPlayer.setConvolverImpulse(clipData);
                    }
                };

                MScheduler.schedule(()=>scope.$apply());
            },
            controller: 'ControlPanelCtrl'
        }
    }
})();
