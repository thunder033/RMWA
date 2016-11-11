/**
 * Created by gjr8050 on 11/9/2016.
 */
angular.module('mallet').factory('MParticle', ['MalletMath', 'MCamera', 'Geometry', 'MScheduler', 'MEasel', function(MM, MCamera, Geometry, MScheduler, MEasel){
    "use strict";

    var particleSpeed = .001;

    function Particle(params){
        this.transform = new Geometry.Transform();
        this.velocity = MM.vec3(0);
        this.acceleration = MM.vec3(0);
        this.active = true;

        this.startEnergy = params.energy || 0;
        this.startVelocity = params.startVelocity;
        this.sizeDecay = params.sizeDecay || 0;
        this.speed = params.speed || 1;
    }

    Particle.prototype.die = function(){
        this.active = false;
        this.transform.scale.scale(0);
    };

    Particle.prototype.setActive = function(spawnPosition){
        this.active = true;
        this.energy = this.startEnergy;
        this.transform.position.set(spawnPosition);
        this.transform.scale = MM.vec3(1);
        this.velocity = MM.vec3(
            (.5 - Math.random()) * particleSpeed * this.speed,
            (.5 - Math.random()) * particleSpeed * this.speed,
            0).add(this.startVelocity);
    };

    Particle.prototype.update = function (dt) {
        this.velocity.add(MM.Vector3.scale(this.acceleration, dt));
        this.transform.position.add(MM.Vector3.scale(this.velocity, dt));
        this.transform.scale.scale(1 - this.sizeDecay);

        this.energy -= dt;
    };

    /**
     * Temporary generation function; makes green square
     * @returns {*|HTMLCanvasElement}
     */
    function blitParticle(){
        var size = 10;
        //Create a temporary canvas
        MEasel.createNewCanvas('particle', size, size);
        var cacheCtx = MEasel.getContext('particle');
        cacheCtx.fillStyle = '#0f0';
        cacheCtx.fillRect(0, 0, size, size);

        //Return the rendered image
        return cacheCtx.canvas;
    }

    /**
     *
     * @param {Object} params
     * @param {number} [params.energy=100]
     * @param {Image} [params.image]
     * @param {number} [params.maxParticleCount=100]
     * @param {number} [params.priority=0]
     * @param {number} [params.sizeDecay=0] rate at which particle will decay in size
     * @param {number} [params.speed=1] speed of particles
     * @param {Vector3} [params.startVelocity] velocity to add to all particles when they spawn
     * @param {Transform} params.transform
     * @constructor
     */
    function Emitter(params) {
        this.transform = params.transform || new Geometry.Transform();

        this.maxParticleCount = params.maxParticleCount || 100;
        this.particles = new Array(this.maxParticleCount);
        this.particles.fill(null);

        this.transforms = new Array(this.maxParticleCount);
        this.transforms.fill(null);

        this.emitPosition = 1;
        this.endPosition = 0;
        this.image = params.image || blitParticle();

        this.paritcleParams = {
            energy: params.energy || 100,
            sizeDecay: params.sizeDecay || 0,
            speed: params.speed || 1,
            startVelocity: params.startVelocity || MM.vec3(0)
        };

        MScheduler.schedule((dt) => {
            this.update(dt);
        }, params.priority);
    }

    Emitter.prototype.canEmit = function(){
        return this.emitPosition !== this.endPosition;
    };

    Emitter.prototype.emit = function(){
        if(this.canEmit()){
            var p = this.emitPosition;
            if(this.particles[p] === null){
                this.particles[p] = new Particle(this.paritcleParams);
                this.transforms[p] = this.particles[p].transform;
            }

            this.particles[p].setActive(this.transform.position);
            this.transforms[p] = this.particles[p].transform;

            if(++this.emitPosition >= this.particles.length){
                this.emitPosition = 0;
            }
        }
        else {

        }
    };

    Emitter.prototype.draw = function() {
        MCamera.billboardRender(this.image, this.transforms, this.transform);
    };
    Emitter.prototype.update = function (dt) {
        //console.log(this.endPosition + ' ' + this.emitPosition);
        var count = this.particles.length;
        for(var p = this.endPosition, c = 0; c < count; p++, c++){
            if(p >= this.particles.length){
                p = 0;
            }

            if(this.particles[p] === null){
                continue;
            }

            this.particles[p].update(dt);
            if(this.particles[p].energy <= 0 && this.particles[p].active === true){
                this.particles[p].die();
                this.transforms[p] = null;

                if(++this.endPosition >= this.particles.length){
                    this.endPosition = 0;
                }

            }
        }

        MScheduler.draw(dt => {
            this.draw(dt);
        });
    };

    return {
        Emitter: Emitter
    }
}]);