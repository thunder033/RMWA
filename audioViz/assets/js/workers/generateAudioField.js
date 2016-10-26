/**
 * Created by gjrwcs on 10/25/2016.
 */
"use strict";

//https://github.com/corbanbrook/dsp.js
self.importScripts('../dsp.js');

/**
 * Generates a level based off the raw PCM audio data provided
 * @param frameBuffers
 * @param frequencyBinCount
 * @param sampleRate
 * @returns {Float32Array}
 */
function generateAudioField(frameBuffers, frequencyBinCount, sampleRate){

    var fft = new FFT(frequencyBinCount, sampleRate),
        frequencyRanges = [0, 60, 250, 2000, 6000, 21050],
        df = frameBuffers[0].length / 2;

    console.log(frameBuffers);
    var fftSpectra = [],
        loudness = new Float32Array(frameBuffers.length);

    for(var i = 0; i < frameBuffers.length; i++){
        fft.forward(frameBuffers[i]);
        fftSpectra[i] = fft.spectrum.slice();

        var avg = 0;
        for(var f = 0; f < fftSpectra[i].length; f++){
            avg += fftSpectra[i][f] / fftSpectra[i].length;
        }
        loudness[i] = avg;
    }

    //normalize loudness values
    var maxLoudness = loudness.reduce( (val, max) => val > max ? val : max, 0);
    console.log(maxLoudness);
    for(var o = 0; o < loudness.length; o++){
        loudness[o] = loudness[o] / maxLoudness;
    }

    //The current "level" is just based off the normalized loudness values of each frame
    //more complex analysis will be done later to generate actual levels
    return loudness;
}

onmessage = function(e){
    var audioField = generateAudioField(e.data.frameBuffers, e.data.frequencyBinCount, e.data.frameBuffers);
    postMessage({
        _id: e.data._id,
        audioField: audioField
    });
};