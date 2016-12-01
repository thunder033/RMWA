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
                },
                options: {
                    alias: {
                        'angular': './scripts/angular.min.proxy.js',
                        'angular-ui-router': './node_modules/angular-ui-router/release/angular-ui-router.min.js'
                    }
                }
            }
        },
        jshint: {
            options: {
                jshintrc: true,
                reporter: require('jshint-stylish')
            },
            all: ['pulsar/app/**/*.js']
        },
        clean: {
            all: ['pulsar/dist/*', '.tmp/*'],
            pulsarDist: ['pulsar/dist/*'],
            tmp: ['.tmp/*']
        },
        copy: {
            prod: {
                files: [{expand: true, src: [
                    // Pulsar
                    'pulsar/dist/**',
                    'pulsar/index.html',
                    'pulsar/assets/**',
                    'pulsar/views/**',
                    // Prod audio files are stored in an external directory
                    '!pulsar/assets/audio/songs/**',
                    // JS files are embedded in dist bundle
                    '!pulsar/assets/js/**',

                    'drawingApp/**',
                    './home/**',
                    './js/**',
                    './SG1/**',

                    '.htaccess',
                    'index.html',
                    'LICENSE',
                    'package.json',
                ], dest: '.tmp'}]
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['jshint:all', 'clean:pulsarDist', 'browserify']);
    grunt.registerTask('build-prod', ['jshint:all', 'clean:pulsarDist', 'clean:tmp', 'browserify', 'copy:prod']);
};