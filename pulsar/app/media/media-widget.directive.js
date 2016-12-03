'use strict';
/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular')
    .module('pulsar.media')
    .directive('mediaWidget', [
        mediaWidgetDirective
    ]);

function mediaWidgetDirective(){
    return {
        restrict: 'E',
        templateUrl: 'views/media-widget.html',
        link: function(){

        }
    };
}