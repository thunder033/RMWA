"use strict";

//http://stackoverflow.com/questions/26668430/is-it-possible-to-run-angular-in-a-web-worker
self.window = self;

// Setup stubs for angular required document properties
// These are normally defined by the browser env
self.history = {};
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

// Import angular
var modulesPath = '../../../../node_modules/',
    appPath = '../../../app/';
self.importScripts(`${modulesPath}angular/angular.min.js`);

self.angular = window.angular;

// Load simple request
self.importScripts(`${appPath}shared/simple-request.js`);

// Create stub app
var workerApp = angular.module('worker-app', ['simple-request']);

// Bootstrap the app
self.angular.bootstrap(null, ['worker-app']);


onmessage = function(e) {
    workerApp.run(function(SimpleHttp){
        var data = e.data;
        SimpleHttp[data.method || 'get'](data.url, data.body || data.params, data.params)
            .then(response => {
                postMessage({_id: e.data._id, status: 'OK', data: response});
            }, error => {
                postMessage({_id: e.data._id, status: 'ERROR', message: error});
            });
    });
};