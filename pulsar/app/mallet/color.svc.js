'use strict';
/**
 * Provides utility functions for working with CSS colors
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular').module('mallet').service('MColor', [function(){
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
         * @param hue {number}: 0 - 255
         * @param saturation {string}: percentage 0% - 100%
         * @param lightness {string}: percentage 0% - 100%
         * @param alpha {number}: 0 - 1
         * @returns {string}
         */
        hsla(hue, saturation, lightness, alpha) {
            return `hsla(${hue},${saturation},${lightness},${alpha})`;
        },

        rgbaFromVector(vec, a) {
            var alpha = typeof a === 'number' ? a : 1;
            return 'rgba(' + ~~vec.x  + ',' + ~~vec.y + ',' + ~~vec.z + ',' + alpha + ')';
        }
    };
}]);