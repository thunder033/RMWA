"use strict";
/**
 * Created by gjrwcs on 9/15/2016.
 */
app.directive('controlPanel', function(Visualizer, Effects, Scheduler){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/control-panel.html',
        link: function(scope){
            scope.visualizer = Visualizer;
            scope.effects = Effects;
            
            scope.setCircleRadius = function(value){
                Visualizer.setCircleRadius(value);
            };

            Scheduler.schedule(()=>scope.$apply());
        }
    }
});