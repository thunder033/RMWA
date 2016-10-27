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
    }

    /**
     * Add the given vector to this one
     * @param addend {Vector3}
     */
    Vector3.prototype.add = (addend) => {
        this.x = addend.x;
        this.y = addend.y;
        this.z = addend.z;
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
    }

    /**
     * Adds the given Vector2
     * @param addend {Vector2}
     */
    Vector2.prototype.add = (addend) => {
        this.x = addend.x;
        this.y = addend.y;
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