/**
 * Created by gjr8050 on 10/24/2016.
 */
(()=>{
    'use strict';
    angular.module('mallet').factory('mallet.Thread', ['$q', threadFactory]);

    function threadFactory($q){

        /**
         * Client for a web worker
         * @param {string} script name of the file to use in the worker
         * @constructor
         */
        function Thread(script) {
            if(!window.Worker){
                throw new Error('Web workers are not supported by your browser.')
            }

            var opId = 0,
                invocations = [],
                worker = new Worker(script);

            /**
             * Determine which invocation was responded to and resolve its promise
             * @param {Event} e
             */
            function notifyClient(e) {

                if(typeof e.data._id === 'undefined'){
                    throw new ReferenceError('Worker script did not provide operation ID');
                }

                //check the return status of the worker
                if(e.data._status === 'ERROR'){
                    //If it returned with an error, reject the promise
                    invocations[e.data._id].reject(e.data.message);
                }
                else {
                    //Otherwise resolve the promise
                    invocations[e.data._id].resolve(e.data.data || e.data);
                }

                delete invocations[e.data._id];
            }

            worker.onmessage = notifyClient;
            //worker.onerror =

            /**
             * Send a message to the worker
             * @param {*} params
             * @returns {Promise} resolves when the worker response is received
             */
            this.invoke = (params) => {
                var invocation = $q.defer();
                invocations[++opId] = invocation;
                params._id = opId;

                worker.postMessage(params);
                return invocation.promise;
            };

            /**
             * Indicates if the worker has any pending invocations
             * @returns {boolean}
             */
            this.isIdle = () => {
                return Object.keys(invocations).length === 0;
            };
        }

        return {
            create(script){
                return new Thread(script);
            }
        }
    }
})();