/**
 * Created by Greg on 11/20/2016.
 */
(()=>{
    "use strict";

    angular.module('simple-request', []);

    angular.module('simple-request', [])
        .service('simple-request.SimpleHttp', [SimpleHttp])
        .factory('simple-request.HttpConfig', [httpConfigFactory]);

    function httpConfigFactory(){
        return HttpConfig;
    }

    /**
     * @property {string} method
     * @property {string} url
     * @property {XMLHttpRequest.responseType} responseType
     *
     * @param {Object} params
     * @param {string} params.url the url to request
     * @param {string} [params.method="get"] a request method
     * @param {string} [params.responseType=""] a valid XMLHttpRequest response type
     * @constructor
     */
    function HttpConfig(params)
    {
        this.method = params.method || 'get';
        this.url = params.url;
        this.responseType = params.responseType || XMLHttpRequest.responseType;
    }

    function SimpleHttp($http)
    {


        function doRequest(config)
        {
            return $http(config).then(response => {
                return response.data || response;
            }, error => {
                return `${error.status || error.statusCode}: ${error.message || error}`;
            });
        }

        /**
         * Execute a GET request
         * @param {string} url
         * @param {Object|HttpConfig} params
         * @returns {*}
         */
        this.get = (url, params) => {

            params = params || {};
            params.url = url;

            return doRequest(new HttpConfig(params));
        }
    }

})();