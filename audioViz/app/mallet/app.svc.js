/**
 * Created by Greg on 10/29/2016.
 */
"use strict";
/**
 * For now just handles maintain app state, might change in the future
 */
angular.module('mallet').service('MApp', ['MState', function(MState){

    var self = this,
        stateListeners = [],
        appState = {};

    /**
     * Invokes callbacks for events listening for the given state
     * @param state
     */
    function invokeStateListeners(state) {
        stateListeners.forEach(listener => {
            if(listener.state === state){
                listener.callback();
            }
        })
    }

    /**
     * Indicates if a given state is active
     * @param state
     * @returns {boolean}
     */
    this.hasState = state => {
        return appState[state] === true;
    };

    /**
     * Creates an event listener for the given state
     * @param state
     * @param callback
     */
    this.onState = (state, callback) => {
        stateListeners.push({
            state: state,
            callback: callback
        });
    };

    /**
     * Activates the given state; some states will automatically deactive others
     * @param state
     */
    this.setState = state => {
        console.log('set state:' + state);
        appState[state] = true;
        switch(state){
            case MState.Suspended:
                appState[MState.Running] = false;
                appState[MState.Loading] = false;
                break;
            case MState.Running:
                appState[MState.Suspended] = false;
                appState[MState.Loading] = false;
                break;
        }

        invokeStateListeners(state);
    };

    /**
     * Reset the state machine to the default state, clearing all listeners
     */
    this.clearState = () => {
        Object.keys(MState || {}).forEach(state => {
            appState[MState[state]] = false;
        });
        appState[MState.Loading] = true;

        stateListeners.length = 0;
    };

    /**
     * Deactivate the given state
     * @param state
     */
    this.removeState = state => {
        appState[state] = false;
    };

    function init(){
        self.clearState();
        appState[MState.Loading] = true;
    }

    init();
}]);