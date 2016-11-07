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
     * Creates a shallow copy of the vector
     * @returns {Vector3}
     */
    Vector3.prototype.clone = function () {
        return new Vector3(this.x, this.y, this.z);
    };

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
     * Subtract the given vector to this one
     * @param addend {Vector3}
     */
    Vector3.prototype.subtract = function(addend) {
        this.x -= addend.x;
        this.y -= addend.y;
        this.z -= addend.z;
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

    Vector3.prototype.cross = function(b) {
        return new Vector3(
            this.y * b.z - this.z * b.y,
            this.z * b.x - this.x * b.z,
            this.x * b.y - this.y * b.x
        );
    };

    Vector3.prototype.dot = function(b) {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    };

    Vector3.prototype.len = function () {
        return Math.sqrt(this.len2());
    };

    Vector3.prototype.len2 = function(){
        return this.x * this.x + this.y * this.y + this.z * this.z;
    };

    Vector3.prototype.normalize = function(){
        var len = this.len();
        return new Vector3(
            this.x / len,
            this.y / len,
            this.z / len);
    };

    Vector3.prototype.unit = function(){
        var len = this.len();
        return new Vector3(
            Math.abs(this.x / len),
            Math.abs(this.y / len),
            Math.abs(this.z / len));
    };

    Vector3.prototype.toString = function(){
        return '{' + this.x + ', ' + this.y + ', ' + this.z + '}'
    };

    Vector3.prototype.toBuffer = function(){
        return [this.x, this.y, this.z];
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

    /**
     * Subtract b from a
     * @param a {Vector3}
     * @param b {Vector3}
     * @returns {Vector3}
     */
    Vector3.subtract = (a, b) => {
        return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
    };

    Vector3.Zero = Object.freeze(new Vector3(0));
    Vector3.One = Object.freeze(new Vector3(1));

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