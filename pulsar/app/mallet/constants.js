angular.module('mallet-constants', [])
    //Rendering
    .constant('ScaleFactor', (()=>window.devicePixelRatio || 1)())
    .constant('SampleCount', 1024)
    .constant('MaxFrameRate', 60)
    .constant('MKeys', Object.freeze({
        Down: 40,
        Up: 38,
        Right: 39,
        Left: 37,
        Space: 32,
        Escape: 27
    }));