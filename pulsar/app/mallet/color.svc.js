/**
 * Created by gjr8050 on 10/19/2016.
 */
"use strict";
/**
 * Provides utility functions for working with CSS colors
 */
angular.module('mallet').service('MColor', [function(){
    return {
        /**
         * Generate and RGBA color string from the provided values
         * @param red
         * @param green
         * @param blue
         * @param alpha
         * @returns {string}
         */
        rgba(red, green, blue, alpha) {
            return 'rgba(' + red + ',' + green + ',' + blue + ', ' + alpha + ')';
        },

        /**
         * Generate an HSLA color string from the provided values
         * @param hue
         * @param saturation
         * @param lightness
         * @param alpha
         * @returns {string}
         */
        hsla(hue, saturation, lightness, alpha) {
            return `hsla(${hue},${saturation},${lightness},${alpha})`;
        },

        rgbaFromVector(vec, a) {
            var alpha = typeof a === 'number' ? a : 1;
            return 'rgba(' + ~~vec.x  + ',' + ~~vec.y + ',' + ~~vec.z + ',' + alpha + ')';
        }
    }
}]);