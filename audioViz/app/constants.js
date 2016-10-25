/**
 * Created by gjr8050 on 10/19/2016.
 */
"use strict";
app
    //Visualization
    .constant('Effects', Object.freeze({
        NOISE: 'NOISE',
        INVERT: 'INVERT',
        DESATURATE: 'DESATURATE'
    }))

    //Audio Analysis
    .constant('SampleRate', 44100)
    .constant('MaxFrequency', 21050)
    .constant('FrequencyRanges', [0, 60, 250, 2000, 6000, 21050])

    //Media Loading
    .constant('MediaPath', 'assets/audio/')
    .constant('ReverbImpulsePath', 'assets/reverb-impulses/')
    .constant('AutoPlay', "Trees") //what song to auto-play
    .constant('MediaStates', Object.freeze({
        READY: 'READY',
        LOADING: 'LOADING',
        ERROR: 'ERROR'
    }))
    .constant('MediaType', Object.freeze({
        "Song": 'Song',
        'Effect': 'Effect',
        'ReverbImpulse' : 'ReverbImpulse'
    }));