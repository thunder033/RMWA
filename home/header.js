"use strict";
var h = {};

function writeText(opts){
    var fontHeightMultiplier = opts.fontHeightMultiplier || 1, //normalize the height of the font
        yPosition = opts.y || 0.5, titleHeight = opts.size || 0.1;
    var fontHeight = h.canvas.height * titleHeight * fontHeightMultiplier;
    var textPos = h.canvas.height * (yPosition + titleHeight/2);

    CT.drawShape({ //Header
        fill: opts.color || "black",
        font: fontHeight + "px " + (opts.font || document.querySelector("body").style.fontFamily)
    }, ()=>h.ctx.fillText(opts.text, opts.x * h.canvas.width, textPos));
}

function pctX(x) {
    return h.canvas.width * x;
}

function pctY(y) {
    return h.canvas.height * y;
}

var c1 = {x: 0.66, y: 0.74},
    c2 = {x: 0.9, y: 0.2},
    c3 = {x: 0.8, y: 0.93},
    c4 = {x: 0.517, y: 0.34};

var Colors = {
    RED: "#c00",
    MAROON: "#611",
    LIGHT_GREY: "#ddd"
};

function drawCircles() {
    var PI = Math.PI;

    var arcs = [
        {fill: Colors.RED, x: c1.x, y: c1.y, r: 80},
        {fill: Colors.LIGHT_GREY, x: c1.x, y: c1.y, r: 20},
        {fill: Colors.LIGHT_GREY, x: c3.x, y: c3.y, r: 102},
        {stroke: Colors.RED, x: c1.x, y: c1.y, r: 105, strokeWidth: 8, start: - 4 * PI / 5, end: - PI / 6},
        {stroke: Colors.LIGHT_GREY, x: c1.x, y: c1.y, r: 90, strokeWidth: 20,  start: 6 * PI / 7, end: - PI / 2},
        {stroke: Colors.RED, x: c1.x, y: c1.y, r: 90, strokeWidth: 8,  start: 6 * PI / 7, end: - PI / 2},
        {stroke: Colors.RED, x: c1.x, y: c1.y, r: 90, strokeWidth: 3,  start: - PI / 2, end: - PI / 3},

        {fill: Colors.RED, x: c2.x, y: c2.y, r: 80},
        {fill: Colors.MAROON, x: c2.x, y: c2.y, r: 20},
        {stroke: Colors.RED, x: c2.x, y: c2.y, r: 90, strokeWidth: 8, end: TWO_PI / 3},
        {stroke: Colors.RED, x: c2.x, y: c2.y, r: 90, strokeWidth: 3, start: 4 * PI / 5, end: - PI / 2},

        {fill: Colors.MAROON, x: c3.x, y: c3.y, r: 40},
        {fill: Colors.RED, x: c3.x, y: c3.y, r: 10},
        {stroke: Colors.LIGHT_GREY, x: c3.x, y: c3.y, r: 37, strokeWidth: 8, start: -4 * PI / 5, end: - PI / 3},
        {stroke: Colors.RED, x: c3.x, y: c3.y, r: 75, strokeWidth: 8, start: - PI / 2, end: TWO_PI},
        {stroke: Colors.RED, x: c3.x, y: c3.y, r: 90, strokeWidth: 8, start: PI, end: -PI / 3},
        {stroke: Colors.RED, x: c3.x, y: c3.y, r: 105, strokeWidth: 10, start: - PI / 6, end: PI / 2},

        {fill: Colors.MAROON, x: c4.x, y: c4.y, r: 30},
        {stroke: Colors.RED, x: c4.x, y: c4.y, r: 40, strokeWidth: 8, start: - PI / 6, end: - 3 * PI / 2},
        {stroke: Colors.RED, x: c4.x, y: c4.y, r: 55, strokeWidth: 8, start: PI / 6, end: 4 * PI / 5},
        {stroke: Colors.RED, x: c4.x, y: c4.y, r: 55, strokeWidth: 3, start: 4 * PI / 5, end: - 5 * PI / 6},
        {stroke: Colors.RED, x: c4.x, y: c4.y, r: 30, strokeWidth: 8, start: -4 * PI / 5, end: - PI / 3},
    ];

    arcs.forEach(arc=>{CT.drawPath(
        {fill: arc.fill, stroke: arc.stroke, strokeWidth: arc.strokeWidth, closePath: false},
        ctx=>ctx.arc(pctX(arc.x), pctY(arc.y), arc.r, arc.start || 0, arc.end || TWO_PI)); });
}

function drawScene(){
    h.ctx.clearRect(0, 0, h.canvas.width, h.canvas.height);

    var titlesX = 0.02;

    CT.drawPath({
        stroke: Colors.RED,
        strokeWidth: 10
    }, ctx=>{
        ctx.moveTo(pctX(titlesX), pctY(0.91));
        ctx.lineTo(pctX(0.57), pctY(0.91));
    });

    drawCircles();

    CT.drawPath({
        stroke: Colors.LIGHT_GREY,
        strokeWidth: 8
    }, ctx=>{
        ctx.moveTo(pctX(c1.x), pctY(c1.y));
        ctx.lineTo(pctX(c1.x) - 80, pctY(c1.y))
    });



    writeText({
        text: "IGME 330",
        x: titlesX,
        y: 0.5,
        size: .25,
        font: "Play",
        fontHeightMultiplier: 1.5
    });

    writeText({
        text: "Greg Rozmarynowycz",
        x: titlesX,
        y: 0.75,
        size: 0.15,
        font: "Play",
        fontHeightMultiplier: 1.5
    });

    requestAnimationFrame(drawScene);
}

var headerInit = function(){
    h.canvas = document.querySelector("#header");
    h.ctx = h.canvas.getContext("2d");

    if(!CT){
        console.error("Canvas Tools not found!");
    }
    else {
        CT.setContext(h.ctx);
        CT.setScale(h.canvas);
        requestAnimationFrame(drawScene);
    }
};

window.addEventListener("load", headerInit);