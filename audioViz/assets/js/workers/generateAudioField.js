/**
 * Created by gjrwcs on 10/25/2016.
 */
"use strict";

//https://github.com/corbanbrook/dsp.js
self.importScripts('../dsp.js');

function getMaxIndex(arr){
    var max = -Infinity,
        maxIndex = 0;

    for(var i = 0; i < arr.length; i++){
        if(arr[i] > max){
            max = arr[i];
            maxIndex = i;
        }
    }

    return maxIndex;
}

/**
 * Generates a gems based off the raw PCM audio data provided
 * @param frameBuffers
 * @param frequencyBinCount
 * @param sampleRate
 * @returns {Array}
 */
function generateAudioField(frameBuffers, frequencyBinCount, sampleRate){

    var fft = new FFT(frequencyBinCount, sampleRate),
        frequencyRanges = [0, 400, 650, 21050],
        lanes = new Array(3),
        //frequencyRanges = [0, 60, 250, 2000, 6000, 21050],
        df = 21050 / (frameBuffers[0].length / 2); //delta-frequency between indices after FFT

    //console.log(frameBuffers);
    var fftSpectra = [],
        field = new Array(frameBuffers.length);

    for(var i = 0; i < frameBuffers.length; i++){
        fft.forward(frameBuffers[i]);
        fftSpectra[i] = fft.spectrum.slice();

        var sum = 0,
            sampleCount = 0,
            avg = 0,
            lane = 0;
        for(var f = 0; f < fftSpectra[i].length; f++){
            sampleCount++;
            var frequency = f * df;
            if(frequency + df >= frequencyRanges[lane + 1]){
                lanes[lane] = sum / sampleCount;
                sum = 0;
                sampleCount = 0;
                lane++;
            }
            sum += fftSpectra[i][f];
            avg += fftSpectra[i][f] / fftSpectra[i].length;
        }
        field[i] = {gems: lanes.slice(), loudness: avg};
    }

    //normalize loudness values
    var maxLoudness = field.reduce( (max, val) => val.loudness > max ? val.loudness : max, 0);
    console.log(maxLoudness);
    for(var o = 0; o < field.length; o++){
        field[o].loudness = field[o].loudness / maxLoudness;
        var loudestRange = getMaxIndex(field[o].gems);
        field[o].gems.fill(0);
        field[o].gems[loudestRange] = 1;
    }

    //The current "gems" is just based off the normalized loudness values of each frame
    //more complex analysis will be done later to generate actual gemss
    return field;
}

onmessage = function(e){
    var audioField = generateAudioField(e.data.frameBuffers, e.data.frequencyBinCount, e.data.frameBuffers);
    postMessage({
        _id: e.data._id,
        audioField: audioField
    });
};