/**
 * Created by gjrwcs on 9/15/2016.
 */
"use strict";
app.directive('easel', function(EaselService){

    var canvas, ctx;

    return {
        restrict: 'E',
        scope: {
            context: '&'
        },
        replace: true,
        template: '<div class="easel"><canvas>Your browser does not support canvas</canvas></div>',
        link: function(scope, elem, attr){
            canvas = elem[0].querySelector('canvas');
            ctx = canvas.getContext(attr.context || '2d');

            window.addEventListener('resize', ()=>EaselService.resizeCanvas(canvas, ctx));
            EaselService.resizeCanvas(canvas, ctx);

            ctx.fillStyle = '#f00';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.fillText("AUDIO VISUALIZER", 100, 100);
        }
    }
});