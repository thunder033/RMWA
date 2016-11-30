/**
 * Created by gjr8050 on 11/30/2016.
 */
'use strict';
require('angular')
    .module('pulsar.media')
    .directive('playQueue', [
        'audio.Player',
        playQueueDirective
    ]);

function playQueueDirective(AudioPlayer){
    return {
        restrict: 'E',
        link: function(scope){
            /**
             *
             * @type {Array<IPlayable>}
             */
            scope.queue = [];

            AudioPlayer.addEventListener('ended', ()=>{});
        }
    };
}