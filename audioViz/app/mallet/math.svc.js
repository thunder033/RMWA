/**
 * Created by gjrwcs on 10/27/2016.
 */
"use strict";
angular.module('mallet-math', []).service('MalletMath', [function(){

    /**
     * A simple vector class
     * @param x
     * @param y
     * @param z
     * @constructor
     */
    function Vector3(x, y, z){
        this.x = x;
        this.y = typeof y !== 'undefined' ? y : x;
        this.z = typeof z !== 'undefined' ? z : x;
        Object.seal(this);
    }

    /**
     * Add the given vector to this one
     * @param addend {Vector3}
     */
    Vector3.prototype.add = function(addend) {
        this.x += addend.x;
        this.y += addend.y;
        this.z += addend.z;
        return this;
    };

    /**
     * Scale the vector by the scalar
     * @param scalar
     * @returns {*}
     */
    Vector3.prototype.scale = function(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    };

    /**
     * Multiplies each component of the 2 vectors
     * @param factor
     * @returns {*}
     */
    Vector3.prototype.mult = function (factor) {
        this.x *= factor.x;
        this.y *= factor.y;
        this.z *= factor.z;
        return this;
    };

    /**
     * Add the 2 vectors
     * @param a {Vector3}
     * @param b {Vector3}
     * @returns {Vector3}
     */
    Vector3.add = (a, b) => {
        return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
    };

    this.Vector3 = Vector3;

    /**
     * A simple vector class
     * @param x {number}
     * @param y {number}
     * @constructor
     */
    function Vector2(x, y){
        this.x = x;
        this.y = typeof y !== 'undefined' ? y : x;
        Object.seal(this);
    }

    /**
     * Adds the given Vector2
     * @param addend {Vector2}
     */
    Vector2.prototype.add = function(addend) {
        this.x += addend.x;
        this.y += addend.y;
        return this;
    };

    /**
     * Scales the vector by the scalar
     * @param scalar
     * @returns {*}
     */
    Vector2.prototype.scale = function(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    };

    /**
     * Multiplies each component of the 2 vectors
     * @param factor
     * @returns {*}
     */
    Vector2.prototype.mult = function (factor) {
        this.x *= factor.x;
        this.y *= factor.y;
        return this;
    };

    /**
     *
     * @param a {Vector2}
     * @param b {Vector2}
     * @returns {Vector2}
     */
    Vector2.add = (a, b) => {
        return new Vector2(a.x + b.x, a.y + b.y);
    };

    this.Vector2 = Vector2;

    this.vec2 = (x, y) => {
        return new Vector2(x, y);
    };

    this.vec3 = (x, y, z) => {
        return new Vector3(x, y, z);
    };
}]);