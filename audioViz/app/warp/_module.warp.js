/**
 * Created by gjrwcs on 10/25/2016.
 */
"use strict";
angular.module('pulsar-warp', [])
    .factory('WarpField', ['MConcurrentOperation', 'AudioData', 'SampleCount', function(MConcurrentOperation, AudioData, SampleCount){
        //Create a web worker with the analysis script
        var fieldGenerator = MConcurrentOperation.create('assets/js/workers/generateAudioField.js');

        function WarpField(){
            //Defining a version as a key so that the 'signature' of the object
            //can be compared without analyzing any specific property
            Object.defineProperty(this, 'v1.28', {configurable: false, value: 1, enumerable: true});
            this.duration = 0;
            this.timeStep = NaN;
            this.level = null;
        }

        /**
         * Performs analysis to generate "audio field" and then begins play
         * @param clip
         */
        WarpField.generate = (clip) => {
            var warpField = new WarpField();
            //This function renders all of the PCM data for the entire clip into series of buffers
            //The result thousands of buckets of 1024 samples (~800 per minute of play w/ current config)
            return AudioData.renderFrameBuffers(clip)
                .then(result => {
                    warpField.duration = result.duration;
                    //this is the average duration of time for each buffer created
                    warpField.timeStep = (result.duration / result.frameBuffers.length) * 1000;

                    //Invoke the analysis in a separate thread (using a web worker)
                    return fieldGenerator.invoke({
                        sampleRate: result.sampleRate, //How many samples per second
                        frequencyBinCount: SampleCount, //The number of frequency bins
                        frameBuffers: result.frameBuffers //The actual array of frame buffers
                    });
                }).then(result => {
                    warpField.level = result.audioField; //The "level" generated by the async web worker
                    return warpField;
                });
        };

        return WarpField;
    }])
    .service('WarpFieldCache', ['WarpField', function(WarpField){

        function getObjectSignature(obj){
            return Object.keys(obj).join();
        }

        this.store = (clip, field) => {
            localStorage.setItem(clip.name, JSON.stringify(field));
        };

        this.retrieve = (clip) => {
            var warpField = JSON.parse(localStorage.getItem(clip.name)),
                signature = getObjectSignature(warpField || {});

            if(signature !== getObjectSignature(new WarpField())){
                localStorage.setItem(clip.name, '');
                return null;
            }

            return warpField;
        }
    }])
    .constant('Shapes', Object.freeze({
        Triangle: 'Triangle',
        Quadrilateral: 'Quadrilateral'
    }))
    .service('WarpShip', ['MScheduler', 'MCamera', 'MEasel', 'MalletMath', 'MKeyboard', 'MKeys', 'Shapes', 'WarpLevel', 'WarpState', 'Geometry', function(MScheduler, MCamera, MEasel, MM, MKeyboard, MKeys, Shapes, Warp, WarpState, Geometry){
        var self = this,
            velocity = MM.vec3(0),
            destLane = 0,
            moveSpeed = 0.0035,
            laneWidth = 1.1,
            shipWidth = .03,
            bankAngle = 0,
            tShip = new Geometry.Transform(),
            moving = false;

        tShip.position = MM.vec3(-laneWidth, -1, -2);
        tShip.scale = MM.vec3(.75, .5, .75);

        this.lane = 0;
        this.score = 0;

        function isSwitchingLanes() {
            return destLane !== self.lane;
        }

        function getSwitchDirection(){
            return (destLane - self.lane)
        }

        function hasReachedLane(){
            var lanePos = (destLane - 1) * laneWidth;
            return getSwitchDirection() > 0 ? tShip.position.x >= lanePos : tShip.position.x <= lanePos;
        }

        function getLaneSwitchPct() {
            if(destLane === self.lane){
                return 0;
            }

            var disp = (destLane - self.lane) * laneWidth,
                relPos = (tShip.position.x + laneWidth) % laneWidth;
            return disp < 1 ? 1 - (relPos) / Math.abs(disp) : (relPos) / Math.abs(disp);
        }

        function getLaneCoord() {
            var relPos = (tShip.position.x + laneWidth) % laneWidth;
            return relPos / laneWidth;
        }

        function getLaneFromPos(){
            var rightBound = 0;
            while((rightBound - 1) * laneWidth <= tShip.position.x){
                rightBound++;
            }

            return getLaneCoord() > .5 ? rightBound : rightBound - 1;
        }

        WarpState.onState(WarpState.Loading, ()=>{self.score = 0});

        var transforms = new Array(20);

        for(var i = 0; i < 20; i++){
            transforms[i] = new Geometry.Transform();
            transforms[i].position = MM.vec3(-5 + i * .5, 0, -10.3);
            transforms[i].scale = MM.vec3(.35);
            //MCamera.render(Geometry.meshes.Cube, transform, "#f0f");
        }

        var activeCtrl = null;
        MKeyboard.onKeyDown(MKeys.Left, ()=>activeCtrl=MKeys.Left);
        MKeyboard.onKeyDown(MKeys.Right, ()=>activeCtrl=MKeys.Right);

        function isInBounds(moveDistance) {
            var minBound = -laneWidth - moveDistance,
                maxBound = +laneWidth + moveDistance;
            return tShip.position.x <= maxBound && tShip.position.x >= minBound;
        }

        MScheduler.schedule(dt => {

            if(activeCtrl !== null && MKeyboard.isKeyDown(activeCtrl) && isInBounds(moveSpeed * dt)) {
                tShip.position.x += moveSpeed * dt * (activeCtrl === MKeys.Left ? -1 : 1);
            }
            else if(activeCtrl !== null) {
                var rightBound = 0;
                while((rightBound - 1) * laneWidth <= tShip.position.x){
                    rightBound++;
                }

                var laneCoord = getLaneCoord();
                destLane = (laneCoord > .5) ? rightBound : rightBound - 1;
                self.lane = (laneCoord > .5) ? rightBound - 1 : rightBound;

                if(destLane > 2){
                    destLane = 2;
                    self.lane = 1;
                }
                else if(destLane < 0){
                    destLane = 0;
                    self.lane = 1;
                }

                activeCtrl = null;
            }
            else if(isSwitchingLanes()) {
                tShip.position.x += getSwitchDirection() * moveSpeed * dt;
                if(hasReachedLane()){
                    tShip.position.x = (destLane - 1) * laneWidth;
                    self.lane = destLane;
                    bankAngle = 0;
                }
            }

            var collectOffset = 5,
                collectLane = getLaneFromPos();
            if(Warp.warpField && Warp.warpField[Warp.sliceIndex + collectOffset]){
                Warp.warpField[Warp.sliceIndex + collectOffset].gems.forEach((gem, lane) => {
                    if(gem === 1 && lane === collectLane){
                        self.score++;
                        Warp.warpField[Warp.sliceIndex + collectOffset].gems[lane] = 2;
                    }
                });
            }

            MScheduler.draw((dt, et) => {
                //Draw Ship
                MEasel.context.fillStyle = '#f00';
                var bankPct =  Math.sin(getLaneSwitchPct() * Math.PI);
                tShip.rotation.z = bankPct * bankAngle;
                tShip.rotation.y = bankPct * bankAngle / 6;
                tShip.rotation.x = - Math.PI / 9 - bankPct * Math.abs(bankAngle) / 3;
                MCamera.render(Geometry.meshes.Ship, tShip, MM.vec3(255, 0, 0));
                //MCamera.drawShape(Shapes.Triangle, pos, shipWidth, 10, bankAngle);

                //Draw Shadow
                MEasel.context.fillStyle = 'rgba(0,0,0,.25)';
                MCamera.drawShape(Shapes.Triangle, MM.vec3(tShip.position.x, 0, tShip.position.z), shipWidth * Math.cos(bankAngle), 10, 0);

                //var transform = new Geometry.Transform();
                for(var i = 0; i < 1; i++){
                    transforms[i].rotation = MM.vec3(et / 1000);
                    //MCamera.render(Geometry.meshes.Cube, transform, "#f0f");
                }

                transforms[0].position.x = -1;
                transforms[0].scale = MM.vec3(2);
                //MCamera.render(Geometry.meshes.Cube, transforms[0], MM.vec3(255, 0, 255));

            }, 10);
        });
    }])
    .factory('WarpBar', ['MalletMath', function(MM){
        return {
            //dimensions of the flanking bars
            scale: MM.vec3(1.5, 1, .9),
            margin: .1
        }
    }])
    .service('WarpState', [function(){

        var state,
            stateListeners = [];

        /**
         * Invokes callbacks for events listening for the given state
         * @param state
         */
        function invokeStateListeners(state) {
            stateListeners.forEach(listener => {
                if((listener.state | state) === state){
                    listener.callback();
                }
            });
        }

        /**
         * Creates an event listener for the given state
         * @param state
         * @param callback
         */
        this.onState = (state, callback) => {
            stateListeners.push({
                state: state,
                callback: callback
            });
        };

        Object.defineProperties(this, {
            'current': {get: ()=>state, set: value =>{ state = value; invokeStateListeners(state)}},

            'Paused': {value: 1, enumerable: true},
            'Playing': {value: 2, enumerable: true},
            'LevelComplete': {value: 4, enumerable: true},
            'Loading': {value: 8, enumerable: true}
        });

        this.is = (checkState) => {
            //Checks if the current state is included in the check state
            return (checkState | state) === state;
        };

        state = this.Loading;
    }])
    .service('WarpFieldDraw', ['MScheduler', 'WarpLevel', 'MalletMath', 'MEasel', 'WarpState', 'MCamera', 'Shapes', 'Geometry', 'WarpBar', function(MScheduler, WarpLevel, MM, MEasel, WarpState, MCamera, Shapes, Geometry, Bar){
        var velocity = 0,
            sliceOffset = 3, //how many slice to draw behind the ship (that have already passed)
            meshes = Geometry.meshes,
            Transform = Geometry.Transform;

        var mLaneWidth = .20, //width of each lane
            mLanePadding = .01, //padding on edge of each lane

        tLane = new Transform();
        tLane.scale.x = mLaneWidth - mLanePadding;
        tLane.scale.z = 60;
        tLane.position.z = -37;
        tLane.position.y = -.1;
        tLane.origin.z = -.5;

        var tZero = new Transform();
        tZero.scale.x = mLaneWidth * 3;
        tZero.position = MM.vec3(0, -.1, 6);

        var gems = new Array(WarpLevel.barsVisible);
        for(var g = 0; g < gems.length; g++){
            gems[g] = new Transform();
            //gems[g].position.y = -.5;
            gems[g].rotation.y = Math.PI / 4;
            gems[g].rotation.x = Math.PI / 4;
            gems[g].scale = MM.vec3(.15);
        }

        var tBar = new Transform();
        tBar.origin.x = -1;
        tBar.origin.z = 1;

        function getStartOffset(barBuffer){
            var startOffset = 6;
            for(var i = 0; i < sliceOffset; i++){
                startOffset += barBuffer[i].speed * Bar.scale.z + Bar.margin;
            }

            return startOffset;
        }

        function draw(dt, tt){
            var ctx = MEasel.context,
                startOffset = 6,
                zRot = - Math.PI / 8; //rotation of loudness bars on the edges

            WarpLevel.barOffset += velocity * dt;
            //make the first bar yellow
            //ctx.fillStyle = '#ff0';
            var color = MM.vec3(100,255,255);

            var drawOffset = getStartOffset(WarpLevel.barQueue); //this spaces the bars correctly across the screen, based on how far above the plane the camera is
            for(var i = 0; i < WarpLevel.barsVisible; i++){
                if(i + 10 > WarpLevel.barsVisible){
                    var sliceValue = 1 - (WarpLevel.barsVisible - i) / 10;
                    color = MM.vec3(100 + sliceValue * 110, 255 - sliceValue * 45, 255 - sliceValue * 45);
                }

                var depth = Bar.scale.z * WarpLevel.barQueue[i].speed,
                    zOffset = drawOffset - WarpLevel.barOffset;

                tBar.scale.x = Bar.scale.x * WarpLevel.getLoudness(i);
                tBar.scale.z = depth;

                tBar.position = MM.vec3(-mLaneWidth, 0, zOffset);
                tBar.rotation.z = (-Math.PI) - zRot;
                MCamera.render(meshes.XZQuad, tBar, color);

                tBar.position = MM.vec3(mLaneWidth, 0, zOffset);
                tBar.rotation.z = zRot;
                MCamera.render(meshes.XZQuad, tBar, color);

                var sliceGems = (WarpLevel.warpField[WarpLevel.sliceIndex + i] || {}).gems || [];
                gems[i].scale = MM.vec3(0);
                for(var l = 0; l < 3; l++){
                    if(sliceGems[l] === 1 && (WarpLevel.sliceIndex +i) % 2 === 0){
                        gems[i].scale = MM.vec3(.15);
                        gems[i].rotation.y = tt / 1000;
                        gems[i].position = MM.vec3((l - 1) * mLaneWidth * 3, -.5, zOffset);
                    }
                }

                drawOffset -= depth + Bar.margin ; //add the width the current bar (each bar has a different width)
            }

            tLane.position.x = -mLaneWidth;
            var grey = MM.vec3(225,225,225);
            MCamera.render(meshes.XZQuad, tLane, grey);
            tLane.position.x = 0;
            MCamera.render(meshes.XZQuad, tLane, grey);
            tLane.position.x = mLaneWidth;
            MCamera.render(meshes.XZQuad, tLane, grey);

            //MCamera.render(meshes.XZQuad, tZero, MM.vec3(255,0,0));

            var green = MM.vec3(0,255,0);
            MCamera.render(meshes.Cube, gems, green);
        }

        this.init = () => {
            MScheduler.schedule(()=>{
                if(WarpState.current !== WarpState.Playing) {
                    return;
                }

                MScheduler.draw(draw);
            });
        }

    }])
    .service('WarpLevel', ['MScheduler', 'WarpState', 'WaveformAnalyzer', 'WarpBar', function(MScheduler, WarpState, WaveformAnalyzer, Bar){
        var self = this;
        this.barQueue = [0];
        this.barsVisible = 55;
        self.timeStep = NaN; //this s NaN so that if it doesn't get set we don't get an endless while loop

        this.warpField = null;
        this.sliceIndex = 0; //where we are in the level

        var elapsed = 0; //elapsed time since last bar was rendered
        this.barOffset = 0;  //this value allows the bar to "flow" instead of "jump"

        this.frequencies = []; //the set of waveform frequencies to average to determine bar width/speed
        var frequencySamples = 10; //how many waveform frequencies to average

        this.reset = function(){
            //reset level variables
            self.barQueue = [0, 0, 0];
            elapsed = 0;
            self.sliceIndex = 0;
            self.frequencies = [];
            self.timeStep = NaN;
            self.barOffset = 0;
        };

        this.load = warpField => {
            self.timeStep = warpField.timeStep;
            self.warpField = warpField.level;
        };

        this.getLoudness = relativeIndex => {
            return (self.warpField[self.sliceIndex + relativeIndex] || {}).loudness || 0;
        };

        /**
         * Get the average value of an array of numbers
         * @param arr
         * @returns {*}
         */
        function getAvg(arr) {
            return arr.reduce((avg, value) => avg + value / arr.length, 0);
        }

        /**
         * Update the various properties of the game level
         */
        MScheduler.schedule((dt) => {
            if(WarpState.current !== WarpState.Playing) {
                return;
            }

            //advance through the level
            elapsed += dt;
            /**
             * This creates a sort of independent fixed update the ensures the level follows the song
             * Each bar the screen represents a fixed amount of time, and no matter how wide, can only
             * remain on screen for the duration for everything to stay in sync
             */
            while(elapsed > self.timeStep / 1000){
                elapsed -= (self.timeStep || NaN); //break if timeStep is not set
                self.sliceIndex++;
                self.barOffset = 0; //reset the bar offset

                //remove the bar that just moved off screen
                self.barQueue.shift();

                var waveform = WaveformAnalyzer.getMetrics();
                //Create a new bar
                while(self.barQueue.length < self.barsVisible){
                    //get the current waveform frequency and remove the oldest value
                    self.frequencies.push(((1 / waveform.period) / 10));
                    if(self.frequencies.length > frequencySamples){
                        self.frequencies.shift();
                    }

                    //add a new bar to the queue
                    self.barQueue.push({
                        speed: .95 + .05 * getAvg(self.frequencies) //this value is basically fudged to work well
                    });
                }
            }

            //how fast the set of bars is moving across the screen
            var velocity = (Bar.scale.z * self.barQueue[2].speed + Bar.margin) / self.timeStep;
            self.barOffset -= dt * velocity;

            if(self.sliceIndex > self.warpField.length){
                WarpState.current = WarpState.LevelComplete;
            }
        });
    }])
    //Still a little ugly, but this is workable...
    .service('Warp', function (WarpFieldDraw, WarpLevel, WarpState, MState, MKeyboard, MKeys, AudioClipService, AutoPlay, MediaStates, MScheduler, AudioPlayerService, WarpFieldCache, $q, WarpField) {
        
        var self = this;

        function getWarpField(clip) {
            var cachedField = WarpFieldCache.retrieve(clip);
            if(cachedField){
                return $q.when(cachedField);
            }
            else {
                return WarpField.generate(clip).then(warpField => {
                    WarpFieldCache.store(clip, warpField);
                    return warpField;
                })
            }

        }

        this.playClip = function(clipId){
            var clip = AudioClipService.getAudioClip(clipId);

            if(!clip.state === MediaStates.READY){
                return;
            }

            WarpState.current = WarpState.Loading;
            WarpLevel.reset();

            //Stop any song that's playing
            AudioPlayerService.stop();

            getWarpField(clip).then(function(warpField){
               WarpLevel.load(warpField);

                //Play the clip - this can take time to initialize
                return AudioPlayerService.playClip(clip.id).then(()=>{
                    WarpState.current = WarpState.Playing;

                    //Don't start playing the song if game is paused
                    if(MState.is(MState.Suspended)){
                        WarpState.current = WarpState.Paused;
                        AudioPlayerService.pause();
                    }
                });
            });
        };

        /**
         * Initialize Game
         */
        this.init = () => {
            WarpFieldDraw.init();
            MScheduler.suspendOnBlur(); //Suspend the event loop when the window is blurred
            AudioPlayerService.registerPlayer(); //init the audio player service
            AudioClipService.getClipList() //wait for clips to load
                .then(AudioClipService.loadAudioClips)
                .then(function() {
                    self.playClip(AutoPlay);
                });

            //Setup state events
            MState.onState(MState.Suspended, () => {
                if(WarpState.is(WarpState.Playing)){
                    WarpState.current = WarpState.Paused;
                    AudioPlayerService.pause();
                }
            });

            MState.onState(MState.Running, () => {
                if(WarpState.is(WarpState.Paused)){
                    WarpState.current = WarpState.Playing;
                    AudioPlayerService.resume();
                }
            });

            MKeyboard.onKeyDown(MKeys.Escape, () => { //Escape key toggles playing
                if(WarpState.is(WarpState.Playing) || WarpState.is(WarpState.Paused)) {
                    MState.is(MState.Running) ? MScheduler.suspend() : MScheduler.resume()
                }
            });
        };
    });