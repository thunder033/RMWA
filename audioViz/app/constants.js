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