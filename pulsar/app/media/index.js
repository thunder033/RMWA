/**
 * Created by gjr8050 on 11/16/2016.
 */
'use strict';
/**
 * Sourcing and access of media content
 * @ngdoc module
 * @name pulsar.media
 */
var media = require('angular').module('pulsar.media', []);

require('./media.constants');

require('./i-playable.factory.js');
require('./audio-clip.factory');
require('./playlist.factory');
require('./play-queue.factory');

require('./media-widget.directive');
require('./play-queue.directive');
require('./playlist.directive');

require('./media-library.svc');
require('./source.factory');
require('./source.Pulsar.factory');
require('./source.SoundCloud.factory');


media.run(['media.Library', function (MediaLibrary) {
    MediaLibrary.init();
}]);

/**
 * @type {IModule}
 */
module.exports = media;