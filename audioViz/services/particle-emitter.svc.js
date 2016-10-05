/**
 * Created by Greg on 10/5/2016.
 */

/**
 * The particle emitter provider maintains position, velocity, and other properties of each particle drawn
 * on the screen. It provides an interface to change how particles are emitted and when.
 */
app.service('ParticleEmitter', function(Scheduler, EaselService){

    /**
     * A simple vector class
     * @param x
     * @param y
     * @constructor
     */
    function Vector(x, y){
        this.x = x;
        this.y = typeof y !== 'undefined' ? y : x;
    }

    /**
     * Maintains the properties of a single particle
     * @param position
     * @param velocity
     * @param energy
     * @param size
     * @constructor
     */
    function Particle(position, velocity, energy, size) {
        this.position = position;
        this.velocity = velocity;
        this.energy = energy * 1000;
        this.size = size;
    }

    /**
     * Advance simulation of the particle
     * @param dt
     * @param velocityScale
     */
    Particle.prototype.update = function(dt, velocityScale){
        this.position.x += this.velocity.x * dt * .25 + this.velocity.x * velocityScale * .75;
        this.position.y += this.velocity.y * dt * .25 + this.velocity.y * velocityScale * .75;
        this.energy -= dt;
    };

    /**
     * Pre render a prototype particle into a temporary canvas and retrieve the image
     * @returns {*|HTMLCanvasElement}
     */
    function preRenderParticle(){
        var radius = 10;
        //Create a temporary canvas
        EaselService.createNewCanvas('particle', radius * 2, radius * 2);
        var cacheCtx = EaselService.getContext('particle'),
            origin = new Vector(cacheCtx.canvas.width / 2);

        //Create a gradient for the particle
        var gradient = cacheCtx.createRadialGradient(origin.x, origin.y, radius / 4, origin.x, origin.y, radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        //Render the particle
        cacheCtx.fillStyle = gradient;
        cacheCtx.beginPath();
        cacheCtx.arc(origin.x, origin.y, radius, 0, Math.PI * 2);
        cacheCtx.closePath();
        cacheCtx.fill();

        //Return the rendered image
        return cacheCtx.canvas;
    }

    //Define emission properties
    var particles = [],
        speed = 1,
        emissionEnergy = 0,
        initEnergy = 4,
        size = 1,
        particleImage = preRenderParticle(),
        emitter = {
            /**
             * Increase the emission energy of the emitter, this energy is depleted each time a particle is emitted
             * @param rate
             */
            incrementEmission(rate){
                emissionEnergy += rate;
            },
            /**
             * Set a scalar that will adjust the speed of all particles
             * @param newSpeed
             */
            setParticleSpeed(newSpeed){
                speed = newSpeed;
            },
            /**
             * Set the initial lifespan that particles will be emitted with
             * @param energy
             */
            setInitEnergy(energy){
                initEnergy = energy;
            },
            /**
             * Set the a factor that will adjust the size of new particles
             * @param newSize
             */
            setParticleSize(newSize){
                size = newSize;
            },
            /**
             * Create a new particle
             */
            emit(){
                var canvas = EaselService.context.canvas,
                    aspectRatio = canvas.width / canvas.height;
                var origin = new Vector(canvas.width / 2, canvas.height / 2);
                particles.push(new Particle(
                    new Vector(origin.x, origin.y),
                    //Make particles evenly spread across canvas by taking aspect ratio into account
                    new Vector((.166 - Math.random() / 3) * aspectRatio, (.166 - Math.random() / 3)),
                    initEnergy,
                    Math.random() * size
                ));
            }
        };

    /**
     * Draw all the particles in the emitter
     * @param ctx
     * @param particles
     */
    function drawParticles(ctx, particles){
        for(var i = 0, len = particles.length; i < len; i++){
            var pos = particles[i].position;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.scale(particles[i].size, particles[i].size);
            //Make the particles fade as they near the end of their life
            ctx.globalAlpha = Math.min(particles[i].energy / 500, .75);
            ctx.drawImage(particleImage, 0, 0);
            ctx.restore();
        }
    }

    Scheduler.schedule((deltaTime)=>{
        //Create new particles while we have emission energy
        while(emissionEnergy > 0){
            emissionEnergy -= deltaTime;
            emitter.emit();
        }

        //Update particles in the emitter and filter out those with no energy left
        var nextParticles = [];
        for(var i = 0, len = particles.length; i < len; i++){
            particles[i].update(deltaTime, speed);
            console.log(deltaTime);
            if(particles[i].energy > 0){
                nextParticles.push(particles[i]);
            }
        }
        particles = nextParticles;

        //Draw the particles
        Scheduler.draw(()=>{
            drawParticles(EaselService.context, particles);
        }, 125);
    }, 100);

    return emitter;
});