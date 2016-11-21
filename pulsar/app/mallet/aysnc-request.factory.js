/**
 * Created by Greg on 11/20/2016.
 */
(()=>{
    "use strict";

    angular.module('mallet').service('mallet.AsyncRequest', [
        'MConcurrentOperation',
        '$q',
        asyncRequestFactory]);

    function asyncRequestFactory(MConcurrentOperation, $q){
        
        var asyncScript = 'assets/js/workers/asyncHttpRequest.js';

        /**
         * Finds an idle thread in the pool, if there are any
         * @param {ConcurrentOperation[]} threads
         * @returns {ConcurrentOperation|null}
         */
        function getIdleThread(threads){
            for(var t = 0; t < threads.length; t++)
            {
                if(!threads[t].isIdle()){
                    return threads[t];
                }
            }

            return null;
        }

        /**
         * Creates a pool of threads to be distributed among requests
         * @param {number} [size=1]
         * @constructor
         */
        function RequestPool(size)
        {
            var threads = [], // Threads available to execute requests
                requestQueue = new PriorityQueue(); // queue of pending requests awaiting threads

            //Create thread pool of specified size
            for(var o = 0; o < size || 1; o++) {
                threads.push(MConcurrentOperation.create(asyncScript));
            }

            /**
             * Provides a thread to the next queue request
             * @param {ConcurrentOperation} thread
             */
            function disperseThread(thread) {
                if(requestQueue.peek() !== null){
                    requestQueue.dequeue().resolve(thread);
                }
            }

            // Promise to handle finished op notifications
            // This deferred object never actually gets resolved, it just handles notifications
            var requestComplete = $q.defer();
            //When a request completes, hand off the thread to the next waiting request
            requestComplete.promise.then(null, null, disperseThread);

            /**
             * Queues up a request for an eventually available thread
             * @returns {Promise}
             */
            function waitForIdleThread() {
                var defer = $q.defer();
                requestQueue.enqueue(0, defer);
                return defer.promise;
            }

            /**
             * Gets an available idle thread or waits for one
             * @returns {IPromise<ConcurrentOperation>|Promise}
             */
            function getThread(){
                return $q.when(getIdleThread(threads) || waitForIdleThread());
            }

            /**
             * Sends a request using the next available thread in the pool
             * @param {HttpConfig} config
             * @returns {Promise.<Object>|*}
             */
            this.send = function(config) {
                return getThread().then(thread => {
                    return thread.invoke(config).finally(()=> {
                            requestComplete.notify(thread);
                        });
                });
            };
        }

        /**
         * Create a RequestPool of the specific size
         * @param {number} threadCount
         * @returns {RequestPool}
         */
        function createRequestPool(threadCount){
            return new RequestPool(threadCount);
        }

        //Create a default request pool for arbitrary usage
        var defaultPool = createRequestPool(1);

        /**
         * Sends a request using the default async pool
         * @param {HttpConfig} config
         * @returns {Promise}
         */
        function createRequest(config) {
            return defaultPool.send(config);
        }

        return {
            send: createRequest,
            createRequestPool: createRequestPool
        }
    }
})();