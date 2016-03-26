'use strict';

const Promise = require('bluebird');
const getPixels =  Promise.promisify(require('get-pixels'));

function convertPixelsToHistogram(img) {
	const createHistogramArray = function() {
		const ret = new Array(256);
		for (let i = 0; i < ret.length; i++) {
			ret[i] = 0;
		}
		return ret;
	}

	const width = img.shape[0];
	const height = img.shape[1];

	const histograms = [
		createHistogramArray(),
		createHistogramArray(),
		createHistogramArray(),
	];

	for (let channel = 0; channel < histograms.length; channel++) {
		for (let i = 0; i < width; i++) {
			for (let j = 0; j < height; j++) {
				const pixelValue = img.get(i, j, channel);

        // Erase pixels considered as white
        if (img.get(i, j, 0) < 249 && img.get(i, j, 1) < 249 && img.get(i, j, 2) < 249) {
          histograms[channel][pixelValue]++;
        }
			}
		}
	}

	return histograms;
}

function conertPNGToHistogram(buf) {
  return getPixels(buf, 'image/png')
    .then(convertPixelsToHistogram);
}

function frame(image, ts) {

  let _histogram;

  return {
    getHistogram: function() {
      return new Promise(function(resolve, reject) {
        if (_histogram) {
          return resolve(_histogram);
        }

        conertPNGToHistogram(image).then(function(histogram) {
          _histogram = histogram;
          return resolve(_histogram);
        })
      });
    },

    getTimeStamp: function() {
      return ts;
    }
  }
}

module.exports = frame;
