"use strict";
/**
 * Created by gjrwcs on 9/15/2016.
 */
app.directive('controlPanel', function(Visualizer, Effects, MScheduler, AudioClipService, AudioPlayerService){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/control-panel.html',
        link: function(scope){
            scope.visualizer = Visualizer;
            scope.effects = Effects;

            scope.reverbEffect = {name: 'None', id: 9999};
            scope.reverbEffects = AudioClipService.getAudioClips('reverbImpulse');
            scope.reverbEffects.push({name: 'None', id: 9999});
            
            scope.setCircleRadius = function(value){
                Visualizer.setCircleRadius(value);
            };

            scope.setReverbEffect = function(){
                if(scope.reverbEffect.name === 'None'){
                    AudioPlayerService.disableConvolverNode();
                }
                else {
                    var clipData = AudioClipService.getAudioClip(scope.reverbEffect.name).clip;
                    AudioPlayerService.setConvolverImpulse(clipData);
                }
            };

            MScheduler.schedule(()=>scope.$apply());
        },
        controller: 'ControlPanelCtrl'
    }
});