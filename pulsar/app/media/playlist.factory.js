/**
 * Created by gjrwcs on 11/29/2016.
 */
'use strict';

require('angular')
    .module('pulsar.media')
    .factory('media.Playlist', [
        'media.State',
        'media.IPlayable',
        playlistFactory
    ]);

function playlistFactory(MediaState, IPlayable){
    /**
     * @implements IPlayable
     */
    class Playlist extends IPlayable {

        /**
         * @param {PriorityQueue} [clips
         */
        constructor(clips) {
            super();
            /**
             * list of track in the queue
             * @type {PriorityQueue<AudioClip>}
             * @private
             */
            this._queue = clips || new PriorityQueue();
            /**
             * Maintains the current position of the playlist
             * @type {Iterator<AudioClip>}
             * @private
             */
            this._it = this._queue.getIterator();
        }

        /**
         * Adds a new track to the end of the list
         * @param clip
         */
        addTrack(clip) {
            this._queue.enqueue(0, clip);
        }

        /**
         * Resets the play position to the first track
         */
        reset(){
            this._it = this._queue.getIterator();
        }

        /**
         * Gets the next playable audio clip in the queue
         * @returns {AudioClip}
         */
        getNextPlayable() {
            var playable = null;
            while(!this._it.isEnd()){
                playable = this._it.next();
                if(playable.state !== MediaState.Error){
                    break;
                }
            }

            return playable;
        }

        /**
         *
         * @returns {IPromise.<AudioBuffer>|Promise}
         */
        getBuffer(){
            return this.getNextPlayable().getBuffer();
        }
    }

    return Playlist;
}