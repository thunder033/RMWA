/**
 * Created by gjrwcs on 9/15/2016.
 */
'use strict';
require('angular').module('mallet').service('MEasel', [function () {

    var contexts = {},
        defaultKey = 'default';

    return {
        get context() {
            return contexts[defaultKey];
        },

        isWebGLSupported(){
            try {
                var canvas = document.createElement('canvas');
                return !! window.WebGLRenderingContext && (canvas.getContext('webgl') ||  canvas.getContext('experimental-webgl'));
            }
            catch (e){
                return false;
            }
        },

        getWebGLContext(){
            var canvas = document.createElement('canvas'),
                gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            canvas.id = 'web-gl-render-target';
            contexts.webgl = gl;
            return gl;
        },

        createNewCanvas(contextKey, width, height){
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            contexts[contextKey] = canvas.getContext('2d');
            return canvas;
        },
        getContext(contextKey){
            return contexts[contextKey];
        },
        /**
         * Use a symmetric quarter render to fill canvas
         * @param ctx
         * @param image
         * @param origin
         */
        drawQuarterRender(ctx, image, origin){
            ctx.drawImage(image, origin.x, origin.y);

            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.scale(-1, 1);
            ctx.drawImage(image, 0, 0);
            ctx.scale(1, -1);
            ctx.drawImage(image, 0, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(image, 0, 0);
            ctx.restore();
        },
        setActiveContext(newContext){
            contexts[defaultKey] = newContext;
        },
        clearCanvas(ctx){
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        },
        resizeCanvas(canvas, ctx, scale){
            scale = scale || 1;
            // finally query the various pixel ratios
            var devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1,

                ratio = devicePixelRatio / backingStoreRatio;

            var oldWidth = canvas.clientWidth,
                oldHeight = canvas.clientHeight;

            canvas.width = canvas.clientWidth * scale;
            canvas.height = canvas.clientHeight * scale;

            if(devicePixelRatio !== backingStoreRatio || scale !== 1 ) {

                canvas.width *= ratio;
                canvas.height *= ratio;

                canvas.style.width = oldWidth + 'px';
                canvas.style.height = oldHeight + 'px';
                
                //We don't appear to need this working w/ relative sizes
                //ctx.scale(ratio, ratio);

                ctx = canvas.getContext('2d');
            }
        }
    };
}]);
