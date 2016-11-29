/**
 * Created by Greg on 11/27/2016.
 */
angular.module('pulsar.warp').factory('warp.Bar', ['MalletMath', function(MM){
    return {
        //dimensions of the flanking bars
        scale: MM.vec3(1.5, 1, .9),
        margin: .1
    }
}]);