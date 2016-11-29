/**
 * Created by gjr8050 on 11/16/2016.
 */
'use strict';
/**
 * Sourcing and access of media content
 * @module pulsar.media
 */
var media = require('angular').module('pulsar.media', []);

require('./media.constants');
require('./audio-clip.factory');
require('./playlist.directive');
require('./media-library.svc');
require('./source.factory');
require('./source.Pulsar.factory');

media.run(['media.Library', function (MediaLibrary) {
    MediaLibrary.init();
}]);

/**
 * @type {IModule}
 */
module.exports = media;