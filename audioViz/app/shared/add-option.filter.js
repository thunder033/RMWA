/**
 * Created by gjr8050 on 11/18/2016.
 */
(()=>{
    "use strict";

    angular.module('pulsar').filter('addOption', [addNoneOption]);

    function addNoneOption(){
        return function(options, option){
            options.push(option);
            return options;
        }
    }
})();