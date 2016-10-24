angular.module('mallet-constants', [])
    //Rendering
    .constant('ScaleFactor', (()=>window.devicePixelRatio || 1)())
    .constant('SampleCount', 1024)
    .constant('MaxFrameRate', 60)
    .constant('MediaType', Object.freeze({
        'Clip': 'Clip',
        'ReverbImpulse' : 'ReverbImpulse'
    }));
