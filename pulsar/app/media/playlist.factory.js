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
         * Gets a subset of results from a clip queue
         * @param {number} page
         * @param {Array} clipList
         * @returns {Array<AudioClip>}
         */
        getPage(page, clipList) {
            // clear the clip list
            clipList.length = 0;
            // return an empty array if given an invalid page
            if(!this._queue || typeof page !== 'number'){
                return clipList;
            }

            var pageSize = 10, pos = 0;
            var it = this._queue.getIterator();
            // iterate through queue until end or page is filled
            while(!it.isEnd() && clipList.length < pageSize){
                if(pos++ > page * pageSize){
                    clipList.push(it.next());
                }
                else {
                    it.next();
                }
            }

            return clipList;
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