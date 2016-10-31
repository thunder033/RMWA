/**
 * Created by Greg on 10/28/2016.
 */
"use strict";
angular.module('mallet').service('MKeyboard', ['MKeys', function(MKeys){
    var keyState = [],
        keyDownEvents = [],
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
        keyState[e.keyCode] = false;
        invokeListeners(keyUpEvents, e);
    });
    
    window.addEventListener('keydown', e => {
        keyState[e.keyCode] = true;
        invokeListeners(keyDownEvents, e);
    });
    
    this.isKeyDown = (keyCode) => {
        return keyState[keyCode] === true;
    };

    this.onKeyDown = (key, callback) => {
        keyDownEvents.push({key: key, callback: callback});
    };

    this.onKeyUp = (key, callback) => {
        keyUpEvents.push({key: key, callback: callback});
    };
}]);