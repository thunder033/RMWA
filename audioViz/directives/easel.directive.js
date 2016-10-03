/**
 * Created by gjrwcs on 9/15/2016.
 */
"use strict";
app.directive('easel', function(EaselService, Scheduler){

    var canvas, ctx, scale = 1;

    return {
        restrict: 'E',
        scope: {
            context: '&'
        },
        replace: true,
        template: '<div class="easel"><canvas>Your browser does not support canvas</canvas></div>',
        link: function(scope, elem, attr){
            console.log('link func');
            canvas = elem[0].querySelector('canvas');
            canvas.style.background = "#200";
            ctx = canvas.getContext(attr.context || '2d');

            window.addEventListener('resize', ()=>EaselService.resizeCanvas(canvas, ctx));
            EaselService.resizeCanvas(canvas, ctx);
            EaselService.setActiveContext(ctx);

            var baseCanvas = EaselService.context.canvas;
            EaselService.createNewCanvas('quarterRender', baseCanvas.width / 2, baseCanvas.height / 2);

            Scheduler.schedule(()=>{
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
                    //ctx.fillStyle = '#200';
                    //ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.fillStyle = "#fff";
                    ctx.fillText("FPS: " + (~~Scheduler.FPS), 25, 25);
                });
            });

        }
    }
});