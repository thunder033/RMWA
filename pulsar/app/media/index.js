/**
 * Created by gjr8050 on 11/16/2016.
 */
'use strict';
/**
 * Sourcing and access of media content
 * @ngdoc module
 * @name pulsar.media
 */
var media = require('angular').module('pulsar.media', [
        require('modular-adal-angular')
    ]);

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
require('./source.Groove.factory');

media.config([
    //'$routeProvider',
    '$httpProvider',
    'adalAuthenticationServiceProvider',
    mediaConfig
]).run(['media.Library', function (MediaLibrary) {
    MediaLibrary.init();
}]);

function mediaConfig($httpProvider, adalProvider){
    adalProvider.init({
        // Use this value for the public instance of Azure AD
        instance: 'https://login.microsoftonline.com',
        // The 'common' endpoint is used for multi-tenant applications like this one
        tenent: 'common',

        clientId: 'Pulsar',

        anonymousEndpoints: ['/','/flare','/warp']
    }, $httpProvider);
}

/**
 * @type {IModule}
 */
module.exports = media;