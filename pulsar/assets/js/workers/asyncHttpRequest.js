"use strict";

// http://stackoverflow.com/questions/26668430/is-it-possible-to-run-angular-in-a-web-worker
self.window = self;

// Setup stubs for angular required document properties
// These are normally defined by the browser env
self.history = {};
self.Node = {prototype: {}}; //this one is new (not in SO question)
self.document = {
    readyState: 'complete',
    querySelector: function () {},
    createElement: function () {
        return {
            pathname: '',
            setAttribute: function () {}
        }
    }
};

var appPath = '../../../app/';

// Import angular
var angular = require('angular');

self.angular = angular;

// Load simple request
// for some reason this has to be a single string???
var simpleRequest = require('../../../app/shared/simple-request');
//self.importScripts(`${appPath}shared/simple-request.js`);

// Create stub app
var workerApp = angular.module('worker-app', [simpleRequest.name]);

/**
 * Determines is one of the classes implementing the Transferable interface
 * @param data
 * @returns {boolean}
 */
function isTransferable(data) {
    return data instanceof ArrayBuffer || data instanceof ImageBitmap || data instanceof MessagePort;
}

function processMessage(e) {
    workerApp.run(['simple-request.SimpleHttp', function(SimpleHttp){
        var data = e.data;
        SimpleHttp[data.method || 'get'](data.url, data.body || data, data)
            .then(response => {
                var transferList = (isTransferable(response)) ? [response] : [];
                postMessage({_id: e.data._id, _status: 'OK', data: response}, transferList);
            }, error => {
                postMessage({_id: e.data._id, _status: 'ERROR', message: error});
            });
    }]);

    // Bootstrap the app
    self.angular.bootstrap(null, ['worker-app']);
}

self.addEventListener('message', processMessage);