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
            scope.playing = null;
            
            var pageLength = 10;
            scope.seekPage = function (direction) {
                var dir = MM.sign(direction); //guarantee -1, 0, or 1

                // If seeking up the queue, move the position pointer to the start of the current page
                if(dir <= 0){
                    // Because were working with zero-indexed page, subtract 1 from length
                    // If the page was empty though, don't subtract a negative length
                    scope.pos -= MM.clamp(scope.page.length - 1, 0, Number.MAX_VALUE);
                } else {
                    scope.pos++; // Start page with the next item if moving forward
                }

                // 0 indicates refreshing the current page, so still move down the list
                // (after resetting the position)
                if(dir === 0){
                    dir = 1;
                }

                // Clear the page
                scope.page.length = 0;

                var items = scope.queue.getItems(), // Get the entire queue
                    pageWeight = 0, // combined weight of items currently on the page
                    func = dir > 0 ? 'push' : 'unshift'; // how items will be addded to the page

                while(pageWeight < pageLength && scope.pos < items.length && scope.pos >= 0) {
                    scope.page[func](items[scope.pos]);
                    pageWeight += (items[scope.pos] instanceof Playlist) ? 5 : 1;
                    scope.pos += dir;
                }

                // Cancel out the last position move, so the position pointer is always at the last item on the page
                scope.pos -= dir;
            };

            function playNext(){
                scope.playing = scope.queue.getNext();
                if(typeof scope.playing !== 'undefined'){
                    scope.audioPlayer.playClip(scope.playing);
                }
            }

            scope.queue.addEventListener('itemAdded', ()=>{
                scope.seekPage(0);
                if(scope.audioPlayer.state === scope.audioPlayer.states.Stopped){
                    playNext();
                }
            });

            scope.queue.addEventListener('itemDequeued', ()=>{scope.seekPage(0);});
        }
    };
}