/**
 * Created by Greg on 10/19/2016.
 */
"use strict";
app.filter('secondsToDate', [function(){
  return function(seconds){
    return new Date(1970, 0, 0).setSeconds(seconds);
  };
}]);