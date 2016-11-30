/**
 * Created by Greg on 11/27/2016.
 */
require('angular').module('pulsar.warp').factory('warp.Bar', ['MalletMath', function(MM){
    return {
        //dimensions of the flanking bars
        scale: MM.vec3(1.5, 1, 0.9),
        margin: 0.1
    };
}]);