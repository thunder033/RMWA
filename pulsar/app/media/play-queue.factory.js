'use strict';
/**
 * Created by Greg on 12/1/2016.
 */
require('angular')
    .module('pulsar.media')
    .factory('media.PlayQueue', [
        'media.const.State',
        'media.IPlayable',
        playQueueFactory
    ]);

function playQueueFactory(MediaState, IPlayable) {

    class PlayQueue {
        constructor(audioPlayer){
            /** @type {Array<IPlayable>} */
            this._queue = [];
            /** @type {audio.Player} */
            this._player = audioPlayer;

            audioPlayer.addEventListener('ended', ()=>{
                var next = this.getNext();
                if(next !== null){
                    this._player.playClip(next);
                }
            });
        }

        getNext(){
            var next = null;
            do {
                if(this._queue.length === 0){
                    break;
                }

                next = this._queue.shift();
            } while (next.getState() === MediaState.Error );
            return next;
        }

        /**
         * Adds the playable item to the queue with the given placement
         * @param {IPlayable} playable - item to add to the play queue
         * @param {int} [placement=PlayQueue.PlayNext] where to add the item
         */
        addItem(playable, placement){
            if(!(playable instanceof IPlayable)){
                throw new TypeError('Only objects of type IPlayable can be queued');
            }

            placement = typeof placement === 'undefined' ? PlayQueue.PlayNext : placement;
            switch (placement){
                case PlayQueue.PlayNext:
                    this._queue.unshift(playable);
                    break;
                case PlayQueue.QueueEnd:
                    this._queue.push(playable);
                    break;
                case PlayQueue.PlayNow:
                    this._player.playClip(playable);
                    break;
                default:
                    throw new ReferenceError('Invalid placement value: ' + placement);
            }
        }

        /**
         * Get the list of items in the queue
         * @returns {Array.<IPlayable>}
         */
        getItems(){
            return this._queue;
        }
    }

    PlayQueue.PlayNext = 0;
    PlayQueue.PlayNow = 1;
    PlayQueue.QueueEnd = 2;

    return PlayQueue;
}