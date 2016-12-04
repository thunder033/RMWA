/**
 * Created by Greg on 11/27/2016.
 */
'use strict';

var browserify = {
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
};

module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dev: {
                files: browserify.files,
                options: {
                    alias: browserify.options.alias,
                    browserifyOptions: {
                        debug: true
                    }
                }
            },
            dist: browserify
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
        cssmin: {
            options: {
                sourceMap: true,
                report: 'min'
            },
            target: {
                files: {
                    //Only include font-awesome.min
                    'pulsar/dist/css/release.css': ['pulsar/assets/css/**/*.css', '!pulsar/assets/css/font-awesome.css']
                }
            }
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
                    '!pulsar/assets/fonts/**',
                    '!pulsar/assets/css/**',
                    // JS files are embedded in dist bundle
                    '!pulsar/assets/js/**',

                    'drawingApp/**',
                    './home/**',
                    './js/**',
                    './SG1/**',

                    '.htaccess',
                    'index.html',
                    'LICENSE',
                    'package.json'
                ], dest: '.tmp'}]
            },
            pulsarAssets: {
                files: [
                    { expand: true, cwd: 'pulsar/assets/fonts', src: ['*'], dest: 'pulsar/dist/fonts/'}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['build-dev']);

    grunt.registerTask('build-dev', [
        'jshint:all',
        'clean:pulsarDist',
        'browserify:dev',
        'cssmin',
        'copy:pulsarAssets'
    ]);

    grunt.registerTask('build-prod', [
        'jshint:all',
        'clean:pulsarDist',
        'clean:tmp',
        'browserify:dist',
        'cssmin',
        'copy:pulsarAssets',
        'copy:prod']);
};