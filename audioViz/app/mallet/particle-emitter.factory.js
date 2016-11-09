/**
 * Created by gjr8050 on 11/9/2016.
 */
angular.module('mallet').factory('MParticle', ['MalletMath', 'MCamera', 'Geometry', 'MScheduler', function(MM, MCamera, Geometry, MScheduler){
    "use strict";

    function Particle(params){
        this.transform = new Geometry.Transform();
        this.velocity = MM.vec3(0);
        this.acceleration = MM.vec3(0);
        this.active = true;
        this.energy = params.energy || 1;
    }

    Particle.prototype.die = function(){
        this.active = false;
    };

    Particle.prototype.setActive = function(){
        this.active = true;
    };

    Particle.prototype.update = function (dt) {
        this.velocity.add(MM.Vector3.scale(this.acceleration, dt));
        this.transform.position.add(MM.Vector3.scale(this.velocity, dt));

        this.energy -= dt;
    };

    function Emitter(params) {
        this.transform = params.transform || new Geometry.Transform();

        this.maxParticleCount = params.maxParticleCount || 100;
        this.particles = new Array(this.maxParticleCount);
        this.particles.fill(null);

        this.transforms = new Array(this.maxParticleCount);
        this.transforms.fill(null);

        this.emitPosition = 1;
        this.endPosition = 0;

        this.paritcleParams = {
            energy: params.energy
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

            this.particles[p].setActive();

            if(++this.emitPosition > this.particles.length){
                this.emitPosition = 0;
            }
        }
        else {

        }
    };

    Emitter.prototype.draw = function(dt) {


    };

    Emitter.prototype.update = function (dt) {
        for(var p = this.endPosition; p < this.emitPosition; p++){
            if(p > this.particles.length){
                p = 0;
            }

            this.particles[p].update(dt);
            if(this.particles[p].energy <= 0){
                this.particles[p].die();
                this.endPosition++;
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