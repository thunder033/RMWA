/**
 * Created by gjrwcs on 10/25/2016.
 */
"use strict";

self.importScripts('../dsp.js');

function generateAudioField(frameBuffers, frequencyBinCount, sampleRate){

    var fft = new FFT(frequencyBinCount, sampleRate);

    console.log(frameBuffers);
    var fftSpectra = [];
    for(var i = 0; i < frameBuffers.length; i++){
        fft.forward(frameBuffers[i]);
        //console.log(fft.spectrum);
        fftSpectra[i] = fft.spectrum.slice();
    }

    return fftSpectra;
}

onmessage = function(e){
    var audioField = generateAudioField(e.data.frameBuffers, e.data.frequencyBinCount, e.data.frameBuffers);
    postMessage({
        _id: e.data._id,
        audioField: audioField
    });
};