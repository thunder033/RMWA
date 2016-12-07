/**
 * Created by Greg on 11/20/2016.
 */
'use strict';

/**
 * Utility for making AJAX requests
 * @module simple-request
 */
var simpleRequest = require('angular').module('simple-request', []);

simpleRequest
    .service('simple-request.SimpleHttp', ['$http', SimpleHttp])
    .factory('simple-request.HttpConfig', [httpConfigFactory]);

/**
 * @returns {HttpConfig}
 */
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
    if(typeof params.url !== 'string'){
        throw new TypeError('URL must be a string');
    }

    this.method = params.method || 'get';
    this.url = params.url;
    this.responseType = params.responseType || XMLHttpRequest.responseType;
}

HttpConfig.get = function(url){
    return new HttpConfig({url: url});
};

function SimpleHttp($http)
{
    function doRequest(config)
    {
        return $http(config).then(response => {
            return response.data || response;
        }, error => {
            throw `${error.status || error.statusCode}: ${JSON.stringify(error.message || error.data || error)}`;
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

        var config = (params instanceof HttpConfig) ? params : new HttpConfig(params);

        return doRequest(config);
    };
}

module.exports = simpleRequest;