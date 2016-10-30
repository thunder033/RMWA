/**
 * Created by Greg on 10/28/2016.
 */
"use strict";
angular.module('mallet').service('MKeyboard', [function(){
    var keyDownEvents = [],
        keyUpEvents = [];

    function invokeListeners(listeners, e){
        listeners.forEach(listener => {
            //this is sort of unreliable but should be good enough for our purposes
            if(listener.key === e.keyCode || listener.key === String.fromCharCode(e.keyCode)){
                listener.callback(e);
            }
        });
    }

    window.addEventListener('keyup', e => {
        invokeListeners(keyUpEvents, e);
    });
    
    window.addEventListener('keydown', e => {
        invokeListeners(keyDownEvents, e);
    });

    this.onkeydown = (key, callback) => {
        keyDownEvents.push({key: key, callback: callback});
    };

    this.onkeyup = (key, callback) => {
        keyUpEvents.push({key: key, callback: callback});
    };
}]);