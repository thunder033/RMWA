// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
	//  properties
  WIDTH : 640,
  HEIGHT: 480,
  canvas: undefined,
  ctx: undefined,
  lastTime: 0, // used by calculateDeltaTime()
  debug: true,
  paused: false,
  animationID: 0,

  CIRCLE: Object.freeze({
    NUM_CIRCLES_START: 5,
    NUM_CIRCLES_END : 20,
    START_RADIUS : 8,
    MAX_RADIUS : 45,
    MIN_RADIUS : 2,
    MAX_LIFETIME : 2.5,
    MAX_SPEED : 80,
    EXPLOSION_SPEED : 60,
    IMPLOSION_SPEED : 84
  }),

  CIRCLE_STATE: Object.freeze({ //circle state enum
    NORMAL: 0,
    EXPLODING: 1,
    MAX_SIZE: 2,
    IMPLODING: 3,
    DONE: 4
  }),

  GAME_STATE: Object.freeze({
    BEGIN: 0,
    DEFAULT: 1,
    EXPLODING: 2,
    ROUND_OVER: 3,
    REPEAT_LEVEL: 5,
    END: 5
  }),

  circles: [],
  numCircles: this.CIRCLE.NUM_CIRCLES_START,

  // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');

    //create circles
    this.numCircles = this.CIRCLE.NUM_CIRCLES_START;
    this.circles = this.makeCircles(this.numCircles);

    //input events
    this.canvas.onmousedown = this.doMousedown.bind(this);

		// start the game loop
		this.update();
	},

  doMousedown: function(e){
    var mouse = getMouse(e);
    this.checkCircleClicked(mouse);
  },

  checkCircleClicked: function (mouse) {
  // looping through circle array backwards, why?
    for (var i = this.circles.length - 1; i >= 0; i--) {
      var c = this.circles[i];
      if (pointInsideCircle(mouse.x, mouse.y, c)) {
        c.fillStyle = "red";
        c.xSpeed = c.ySpeed = 0;
        break; // we want to click only one circle
      }
    }
  },

  makeCircles: function (num) {
    function circleDraw(ctx){
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fillStyle = this.fillStyle;
      ctx.fill();
      ctx.restore();
    }

    function circleMove(dt){
      this.x += this.xSpeed * this.speed * dt;
      this.y += this.ySpeed * this.speed * dt;
    }

    var array = [];
    for(var i = 0; i < num; i++) {
      //make an obj literal
      var c = {};
      c.radius = this.CIRCLE.START_RADIUS;

      //add position, this is somewhere within the canvas
      c.x = getRandom(this.CIRCLE.START_RADIUS * 2, this.WIDTH - this.CIRCLE.START_RADIUS * 2);
      c.y = getRandom(this.CIRCLE.START_RADIUS * 2, this.HEIGHT - this.CIRCLE.START_RADIUS * 2);

      var randomVector = getRandomUnitVector();
      c.xSpeed = randomVector.x;
      c.ySpeed = randomVector.y;

      c.speed = this.CIRCLE.MAX_SPEED;
      c.fillStyle = getRandomColor();
      c.state = this.CIRCLE_STATE.NORMAL;
      c.lifetime = 0;
      c.draw = circleDraw;
      c.move = circleMove;

      //no more properties can be added
      Object.seal(c);
      array.push(c);
    }
    return array;
  },

  drawCircles: function(ctx){
    this.circles.forEach(circle=>circle.draw(ctx));
  },

  moveCircles: function(dt){
    this.circles.forEach(circle=>{
      circle.move(dt);

      //did the circle go out of bounds? the bounce
      if(this.circleHitLeftRight(circle)){
        circle.xSpeed *= -1;
      }

      if(this.circleHitTopBottom(circle)){
        circle.ySpeed *= -1;
      }
    });
  },

	circleHitLeftRight: function(circle){
		return (circle.x < circle.radius || circle.x > this.WIDTH - circle.radius);
	},

	circleHitTopBottom: function(circle){
		return (circle.y < circle.radius || circle.y > this.HEIGHT - circle.radius);
	},

  drawPauseScreen: function(ctx){
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.fillText('...PAUSED...', this.WIDTH / 2, this.HEIGHT / 2, '40pt courier', 'white');
    ctx.restore();
  },
	
	update: function(){
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
	 	// if so, bail out of loop
    if(this.paused){
      this.drawPauseScreen(this.ctx);
      return;
    }
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
	 	// 4) UPDATE
	 	// move circles
    this.moveCircles(dt);
	 	
		// 5) DRAW	but
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT); 

		// ii) draw circles
    this.drawCircles(this.ctx);

		// iii) draw HUD
		
		
		// iv) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText("dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}
		
	},
	
	fillText: function(string, x, y, css, color) {
		this.ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		this.ctx.font = css;
		this.ctx.fillStyle = color;
		this.ctx.fillText(string, x, y);
		this.ctx.restore();
	},
	
	calculateDeltaTime: function() {
    var now, fps;
    now = performance.now();
    fps = 1000 / (now - this.lastTime);
    fps = clamp(fps, 12, 60);
    this.lastTime = now;
    return 1 / fps;
  }
    
}; // end app.main