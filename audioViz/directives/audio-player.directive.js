/**
 * Created by gjr8050 on 9/16/2016.
 */
"use strict";
app.directive('audioPlayer', function(){
    return {
        restrict: 'E',
        replace: true,
        template: '<audio controls loop></audio>'
    }
});