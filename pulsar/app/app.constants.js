'use strict';
/**
 * Created by Greg on 11/27/2016.
 */
var constants = require('angular')
    .module('pulsar.constants', [])

    .constant('pulsar.const.Env', (()=>{
        var host = location.host;
        if(host.indexOf('localhost') > -1){
            return 'dev';
        }
        else if(host.indexOf('stage') > -1){
            return 'stage';
        }
        else {
            return 'prod';
        }
    })())
    .constant('pulsar.const.Path', Object.freeze({
        Root: '../',
        Assets: 'dist/',
        App: ''
    }));

module.exports = constants;