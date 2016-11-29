/**
 * Created by Greg on 11/27/2016.
 */
var constants = require('angular')
    .module('pulsar.constants', [])

    .constant('pulsar.const.Path', Object.freeze({
        Root: '../',
        Assets: 'dist/',
        App: ''
    }));

module.exports = constants;