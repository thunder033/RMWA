/**
 * Created by gjrwcs on 9/15/2016.
 */
"use strict";
app.service('EaselService', function () {

    var canvas = null,
        ctx = null;

    return {
        get context() {
            return ctx;
        },
        setActiveContext(newContext){
            ctx = newContext;
        },
        clearCanvas(ctx){
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        },
        resizeCanvas(canvas, ctx){
            // finally query the various pixel ratios
            var devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1,

                ratio = devicePixelRatio / backingStoreRatio;

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            if(devicePixelRatio !== backingStoreRatio) {

                var oldWidth = canvas.width,
                    oldHeight = canvas.height;

                canvas.width = oldWidth * ratio;
                canvas.height = oldHeight * ratio;

                canvas.style.width = oldWidth + "px";
                canvas.style.height = oldHeight + "px";

                ctx.scale(ratio, ratio);

                ctx = canvas.getContext("2d");
            }
        }
    }
});