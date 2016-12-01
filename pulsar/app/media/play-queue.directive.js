/**
 * Created by gjr8050 on 11/30/2016.
 */
'use strict';
require('angular')
    .module('pulsar.media')
    .directive('playQueue', [
        'media.Playlist',
        'MalletMath',
        playQueueDirective
    ]);

function playQueueDirective(Playlist, MM){
    return {
        restrict: 'E',
        templateUrl: 'views/play-queue.html',
        scope: {
            audioPlayer: '=',
            queue: '='
        },
        link: function(scope){
            /** @type {Array<IPlayable>} */
            scope.page = [];
            scope.pos = 0;
            
            var pageLength = 10;
            scope.seekPage = function (direction) {
                console.log('get page ' + direction);
                var dir = MM.sign(direction);

                if(dir <= 0){
                    scope.pos -= scope.page.length;
                }

                if(dir === 0){
                    dir = 1;
                }

                scope.page.length = 0;

                var items = scope.queue.getItems(),
                    pageWeight = 0,
                    func = dir > 0 ? 'push' : 'unshift';

                console.log(scope.pos);

                while(pageWeight < pageLength && scope.pos < items.length && scope.pos >= 0) {
                    scope.page[func](items[scope.pos]);
                    pageWeight += (items[scope.pos] instanceof Playlist) ? 5 : 1;
                    scope.pos += dir;
                }

                scope.pos -= dir;
            };

            scope.queue.addEventListener('itemAdded', ()=>{scope.seekPage(0);});
        }
    };
}