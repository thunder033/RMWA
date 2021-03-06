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

  // Part I - #4A
  // original 8 fluorescent crayons: https://en.wikipedia.org/wiki/List_of_Crayola_crayon_colors#Fluorescent_crayons
  //  "Ultra Red", "Ultra Orange", "Ultra Yellow","Chartreuse","Ultra Green","Ultra Blue","Ultra Pink","Hot Magenta"
  colors: ["#FD5B78","#FF6037","#FF9966","#FFFF66","#66FF66","#50BFE6","#FF6EFF","#EE34D2"],

  circles: [],
  numCircles: 0,
  gameState: null,
  roundScore: 0,
  totalScore: 0,
  
  sound: undefined, //placeholder for sound js

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
    this.gameState = this.GAME_STATE.BEGIN;

    this.bgAudio = document.querySelector("#bgAudio");
    this.bgAudio.volume = 0.25;
    this.effectAudio = document.querySelector("#effectAudio");
    this.effectAudio.volume = 0.3;

    //input events
    this.canvas.onmousedown = this.doMousedown.bind(this);
    window.addEventListener("keyup", this.doKeyUp.bind(this));
		
    //load level
    this.reset();

		// start the game loop
		this.update();
	},

  reset: function(){
    this.numCircles += 5;
    this.roundScore = 0;
    this.circles = this.makeCircles(this.numCircles);
  },
	
  doKeyUp: function(e){
	var char = String.fromCharCode(e.keyCode);
	if (char == "d" || char == "D"){
		this.debug = !this.debug;
	}	  
  },

  doMousedown: function(e){
    this.sound.playBGAudio();

    if(this.paused){
      this.paused = false;
      this.update();
      return;
    }

    if(this.gameState === this.GAME_STATE.EXPLODING){
      return;
    }

    if(this.gameState === this.GAME_STATE.ROUND_OVER){
      this.gameState = this.GAME_STATE.DEFAULT;
      this.reset();
      return;
    }

    if(this.gameState === this.GAME_STATE.END){
      this.gameState = this.GAME_STATE.BEGIN;
      this.totalScore = 0;
      this.numCircles = this.CIRCLE.NUM_CIRCLES_START;
      this.reset();
      return;
    }

    var mouse = getMouse(e);
    this.checkCircleClicked(mouse);
  },

  pauseGame: function(){
    this.stopBGAudio();
    this.paused = true;
    cancelAnimationFrame(this.animationID);
    this.update();
  },

  resumeGame: function(){
    cancelAnimationFrame(this.animationID);
    this.paused = false;
    this.update();
    this.sound.playBGAudio();
  },

  stopBGAudio: function () {
    this.sound.stopBGAudio();
  },

  checkForCollision: function(){
    if(this.gameState == this.GAME_STATE.EXPLODING){
      // check for collisions between circles
      for(var i=0;i<this.circles.length; i++){
        var c1 = this.circles[i];
        // only check for collisions if c1 is exploding
        if (c1.state === this.CIRCLE_STATE.NORMAL) continue;
        if (c1.state === this.CIRCLE_STATE.DONE) continue;
        for(var j=0;j<this.circles.length; j++){
          var c2 = this.circles[j];
          // don't check for collisions if c2 is the same circle
          if (c1 === c2) continue;
          // don't check for collisions if c2 is already exploding
          if (c2.state != this.CIRCLE_STATE.NORMAL ) continue;
          if (c2.state === this.CIRCLE_STATE.DONE) continue;

          // Now you finally can check for a collision
          if(circlesIntersect(c1,c2) ){
            c2.state = this.CIRCLE_STATE.EXPLODING;
            c2.xSpeed = c2.ySpeed = 0;
            this.sound.playEffect();
            this.roundScore ++;
          }
        }
      } // end for

      // round over?
      var isOver = true;
      for(var i=0;i<this.circles.length; i++){
        var c = this.circles[i];
        if(c.state != this.CIRCLE_STATE.NORMAL && c.state != this.CIRCLE_STATE.DONE){
          isOver = false;
          break;
        }
      } // end for

      if(isOver){
        if(this.numCirlces >= this.CIRCLE.NUM_CIRCLES_END){
	  this.gameState = this.GAME_STATE.END;
	  this.stopBGAudio();
	}
        else {
          this.gameState = this.GAME_STATE.ROUND_OVER;
          this.totalScore += this.roundScore;
          this.stopBGAudio();
	}
      }

    } // end if GAME_STATE_EXPLODING
  },

  checkCircleClicked: function (mouse) {
  // looping through circle array backwards, why?
    for (var i = this.circles.length - 1; i >= 0; i--) {
      var c = this.circles[i];
      if (pointInsideCircle(mouse.x, mouse.y, c)) {
        c.xSpeed = c.ySpeed = 0;
        c.state = this.CIRCLE_STATE.EXPLODING;
        this.gameState = this.GAME_STATE.EXPLODING;
        this.roundScore++;
        this.sound.playEffect();
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
      c.fillStyle = this.colors[i % this.colors.length];
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
    if(this.gameState === this.GAME_STATE.ROUND_OVER || this.gameState === this.GAME_STATE.END){
      this.ctx.globalAlpha = 0.25;
    }

    this.circles.forEach(circle=>{
      if(circle.state !== this.CIRCLE_STATE.DONE){
        circle.draw(ctx);
      }
    });
  },

  moveCircles: function(dt){
    this.circles.forEach(circle=>{
      circle.move(dt);

      switch(circle.state){
        case this.CIRCLE_STATE.DONE:
          return;
        case this.CIRCLE_STATE.EXPLODING:
          circle.radius += this.CIRCLE.EXPLOSION_SPEED * dt;
          if(circle.radius > this.CIRCLE.MAX_RADIUS){
            circle.state = this.CIRCLE_STATE.MAX_SIZE;
          }
          break;

        case this.CIRCLE_STATE.MAX_SIZE:
          circle.lifetime += dt;
          if(circle.lifetime >= this.CIRCLE.MAX_LIFETIME){
            circle.state = this.CIRCLE_STATE.IMPLODING;
          }
          break;

        case this.CIRCLE_STATE.IMPLODING:
          circle.radius -= this.CIRCLE.IMPLOSION_SPEED * dt;
          if(circle.radius <= this.CIRCLE.MIN_RADIUS){
            circle.state = this.CIRCLE_STATE.DONE;
            return;
          }
          break;
      }

      //did the circle go out of bounds? the bounce
      if(this.circleHitLeftRight(circle)){
        circle.xSpeed *= -1;
        circle.move(dt);
      }

      if(this.circleHitTopBottom(circle)){
        circle.ySpeed *= -1;
        circle.move(dt);
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
    this.fillText(this.ctx, '...PAUSED...', this.WIDTH / 2, this.HEIGHT / 2, '40pt courier', 'white');
    ctx.restore();
  },

  drawHUD: function(ctx){
    ctx.save(); // NEW
    // draw score
    // fillText(string, x, y, css, color)
    this.fillText(this.ctx, "This Round: " + this.roundScore + " of " + this.numCircles, 20, 20, "14pt courier", "#ddd");
    this.fillText(this.ctx, "Total Score: " + this.totalScore, this.WIDTH - 200, 20, "14pt courier", "#ddd");

    // NEW
    if(this.gameState == this.GAME_STATE.BEGIN){
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      this.fillText(this.ctx, "To begin, click a circle", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "white");
    } // end if

    // NEW
    if(this.gameState == this.GAME_STATE.ROUND_OVER){
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      this.fillText(this.ctx, "Round Over", this.WIDTH/2, this.HEIGHT/2 - 40, "30pt courier", "red");
      this.fillText(this.ctx, "Click to continue", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "red");
      this.fillText(this.ctx, "Next round there are " + (this.numCircles + 5) + " circles", this.WIDTH/2 , this.HEIGHT/2 + 35, "20pt courier", "#ddd");
    } // end if
	 
    if(this.gameState == this.GAME_STATE.END){
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      this.fillText(this.ctx, "Game Over", this.WIDTH/2, this.HEIGHT/2 - 40, "30pt courier", "red");
      this.fillText(this.ctx, "Click to continue", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "red");
      this.fillText(this.ctx, "Final Score " + (this.totalScore), this.WIDTH/2 , this.HEIGHT/2 + 35, "20pt courier", "#ddd");
    }

    ctx.restore(); // NEW
  },
	
	update: function(){
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) Paused?
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

    //check for collisions
    this.checkForCollision();
	 	
		// 5) DRAW	but
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT); 

		// ii) draw circles
    this.ctx.globalAlpha = 0.9;
    this.drawCircles(this.ctx);

		// iii) draw HUD
		this.drawHUD(this.ctx);
		
		// iv) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText(this.ctx, "dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}

    // 6) CHECK FOR CHEATS
    //if we are on the start screen or a round over screen
    if(this.gameState == this.GAME_STATE.BEGIN || this.gameState == this.GAME_STATE.ROUND_OVER){
      if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT]){
        this.totalScore++;
        this.sound.playEffect();
      }
    }
	},
	
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
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
