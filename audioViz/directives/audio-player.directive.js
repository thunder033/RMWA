/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.directive('audioPlayer', function(AudioPlayerService, AudioClipService){

    return {
        restrict: 'E',
        replace: true,
        template: '<audio controls loop></audio>',
        link: function(scope, elem, attr){
            var analyzerNode = AudioPlayerService.createAnalyzerNode(elem[0]);
        }
    }
});