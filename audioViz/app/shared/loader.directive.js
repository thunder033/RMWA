/**
 * Created by Greg on 9/20/2016.
 */
"use strict";
app.directive('loaderIcon', function(){
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="cssload-container"><div class="cssload-speeding-wheel"></div> </div>'
    }
});