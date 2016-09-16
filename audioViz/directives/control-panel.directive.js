"use strict";
/**
 * Created by gjrwcs on 9/15/2016.
 */
app.directive('controlPanel', function(){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/control-panel.html'
    }
});