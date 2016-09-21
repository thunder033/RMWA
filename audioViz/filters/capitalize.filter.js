/**
 * Created by Greg on 9/20/2016.
 */
"use strict";
//http://stackoverflow.com/questions/30207272/capitalize-the-first-letter-of-string-in-angularjs
app.filter('capitalize', function(){
    return function(input){
        return (input && typeof input == "string") ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});