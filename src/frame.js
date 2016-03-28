'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const getPixels = Promise.promisify(require('get-pixels'));
const DevtoolsTimelineModel = require('devtools-timeline-model');

function convertPixelsToHistogram(img) {
	const createHistogramArray = function () {
		const ret = new Array(256);
		for (let i = 0; i < ret.length; i++) {
			ret[i] = 0;
		}
		return ret;
	};

	const width = img.shape[0];
	const height = img.shape[1];

	const histograms = [
		createHistogramArray(),
		createHistogramArray(),
		createHistogramArray()
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

function extractFramesFromTimeline(timelinePath) {
	const trace = fs.readFileSync(timelinePath, 'utf-8');

	const model = new DevtoolsTimelineModel(trace);
	const rawFrames = model.filmStripModel().frames();

	return Promise.map(rawFrames, f => f.imageDataPromise())
		.map(function (img, index) {
			const imgBuff = new Buffer(img, 'base64');
			return frame(imgBuff, rawFrames[index].timestamp);
		});
}

function frame(image, ts) {
	let _histogram = null;
	let _progress = null;

	return {
		getHistogram: function () {
			return new Promise(function (resolve, reject) {
				if (_histogram) {
					return resolve(_histogram);
				}

				conertPNGToHistogram(image).then(function (histogram) {
					_histogram = histogram;
					return resolve(_histogram);
				})
				.catch(reject);
			});
		},

		getTimeStamp: function () {
			return ts;
		},

		setProgress: function (progress) {
			_progress = progress;
		},

		getProgress: function () {
			return _progress;
		}
	};
}

module.exports = {
	extractFramesFromTimeline,
	create: frame
};
