/**
 * Created by Greg on 11/27/2016.
 */
'use strict';
var request = require('request');

//Path for getting build artifacts
var url = 'https://circleci.com/api/v1.1/project/github/thunder033/RMWA/latest/artifacts?circle-token=';

var deployURL = 'http://thunderlab.net/deployRMWA.php',
    payload = {
        artifact_path: `thunder033/RMWA/latest/artifacts/0/dist.tar`,
        environment: process.argv[2] || 'stage'
    },
    options = {
        method: 'POST',
        form: payload
    };

request(deployURL, options, function(error, response, body){
    if(error){
        console.error('Deployment Failed: ' + error.message || error);
    }
    else {
        console.log('Completed Deployment: ' + (body || response.status || response));
    }

});