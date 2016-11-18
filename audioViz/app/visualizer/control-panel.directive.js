/**
 * Created by gjrwcs on 9/15/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar.visualizer').directive('controlPanel', ['Visualizer','Effects','MScheduler','media.Library','media.Type', controlPanel]);

    function controlPanel(Visualizer, Effects, MScheduler, MediaLibrary, AudioPlayer, MediaType){
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/control-panel.html',
            link: function(scope){
                scope.visualizer = Visualizer;
                scope.effects = Effects;

                scope.reverbEffect = {name: 'None', id: 9999};
                scope.reverbEffects = MediaLibrary.getAudioClips(MediaType.ReverbImpulse);
                scope.reverbEffects.push({name: 'None', id: 9999});

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
