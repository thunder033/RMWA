/**
 * Created by gjr8050 on 10/24/2016.
 */
'use strict';
angular.module('mallet').factory('MConcurrentOperation', ['$q', function concurrentOperationFactory($q){
    function ConcurrentOperation(script) {
        if(!window.Worker){
            throw new Error('Web workers are not supported by your browser.')
        }

        var self = this,
            opId = 0,
            invocations = [],
            worker = new Worker(script);

        function notifyClient(e) {
            console.log(e);

            if(typeof e.data._id === 'undefined'){
                throw new ReferenceError('Worker script did not provide operation ID');
            }

            invocations[e.data._id].resolve(e.data);
            delete invocations[e.data._id];
        }

        worker.onmessage = notifyClient;

        this.invoke = (params) => {
            var invocation = $q.defer();
            invocations[opId++] = invocation;
            params._id = opId;

            worker.postMessage(params);
            return invocation.promise;
        };

        this.isIdle = () => {
            return Object.keys(invocations).length === 0;
        };
    }

    return {
        create(script){
            return new ConcurrentOperation(script);
        }
    }
}]);