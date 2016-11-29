/**
 * Created by Greg on 11/27/2016.
 */
'use strict';
module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist: {
                files: {
                    'pulsar/dist/bundle.js': 'pulsar/app/app.module.js',
                    'pulsar/dist/asyncHttpRequest.js': 'pulsar/assets/js/workers/asyncHttpRequest.js',
                    'pulsar/dist/generateAudioField.js': 'pulsar/assets/js/workers/generateAudioField.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['browserify']);
};