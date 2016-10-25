/**
 * Created by gjrwcs on 9/15/2016.
 */
"use strict";
angular.module('mallet').directive('mEasel', ['MEasel','MScheduler', function(EaselService, Scheduler){

    var canvas, ctx, scale = 1;

    return {
        restrict: 'E',
        scope: {
            context: '&'
        },
        replace: true,
        template: '<div class="easel"><canvas>Your browser does not support canvas</canvas></div>',
        link: function(scope, elem, attr){

            canvas = elem[0].querySelector('canvas');
            canvas.style.background = "#200";
            ctx = canvas.getContext(attr.context || '2d');

            window.addEventListener('resize', ()=>EaselService.resizeCanvas(canvas, ctx));
            EaselService.resizeCanvas(canvas, ctx);
            EaselService.setActiveContext(ctx);

            //Create a context to hold pre-rendered data
            var baseCanvas = EaselService.context.canvas;
            EaselService.createNewCanvas('quarterRender', baseCanvas.width / 2, baseCanvas.height / 2);

            //Create a context to pre-render pinwheel arcs
            EaselService.createNewCanvas('arcRender', baseCanvas.width / 2, baseCanvas.height / 2);

            Scheduler.schedule(()=>{
                //Reduce canvas resolution is performance is bad
                if(Scheduler.FPS < 30 && scale == 1){
                    scale = .75;
                    EaselService.resizeCanvas(canvas, ctx, scale);
                }
                else if(Scheduler.FPS > 40 && scale == .75){
                    scale = 1;
                    EaselService.resizeCanvas(canvas, ctx, scale);
                }

                Scheduler.draw(()=>EaselService.clearCanvas(ctx), -1);
                Scheduler.draw(()=>EaselService.clearCanvas(EaselService.getContext('quarterRender')), -1);
                Scheduler.draw(() => {
                    ctx.fillStyle = "#fff";
                    ctx.fillText("FPS: " + (~~Scheduler.FPS), 25, 25);
                });
            });

        }
    }
}]);