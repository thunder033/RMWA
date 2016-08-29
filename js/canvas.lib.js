var TWO_PI = Math.PI * 2;

var CT = {
    ctx: null,

    setScale(canvas){
        // finally query the various pixel ratios
        var devicePixelRatio = window.devicePixelRatio || 1,
            backingStoreRatio = this.ctx.webkitBackingStorePixelRatio ||
                this.ctx.mozBackingStorePixelRatio ||
                this.ctx.msBackingStorePixelRatio ||
                this.ctx.oBackingStorePixelRatio ||
                this.ctx.backingStorePixelRatio || 1,

            ratio = devicePixelRatio / backingStoreRatio;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        if(devicePixelRatio !== backingStoreRatio) {

            var oldWidth = canvas.width,
                oldHeight = canvas.height;

            canvas.width = canvas.clientWidth * ratio;
            canvas.height = canvas.clientHeight * ratio;

            canvas.style.width = oldWidth;
            canvas.style.height = oldHeight;

            this.ctx.scale(ratio, ratio);
        }
    },

    setContext(ctx) {
        this.ctx = ctx;
    },
    /**
     * Draws a path
     * @param options
     * @param draw
     */
    drawPath(options, draw) {
        options.path = true;
        this.drawShape(options, draw);
    },

    /**
     * Saves context, applies options, draws, and restores context
     * @param options
     * @param draw
     */
    drawShape(options, draw) {
        this.ctx.save();

        this.ctx.fillStyle = options.fill || this.ctx.fillStyle;
        this.ctx.font = options.font || this.ctx.font;
        this.ctx.strokeStyle = options.stroke || this.ctx.strokeStyle;
        this.ctx.lineWidth = options.strokeWidth || this.ctx.lineWidth;

        if (draw instanceof Function) {

            if (options.path)
                this.ctx.beginPath();

            draw(this.ctx);

            if (options.path) {
                if(options.closePath !== false)
                    this.ctx.closePath();

                if (options.fill)
                    this.ctx.fill();

                if (options.stroke)
                    this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }
}