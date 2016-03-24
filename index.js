'use strict';

const getPixels = require('get-pixels');

const PIXEL_TOLERENCY = 5;

function getHistograms(img) {
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
				histograms[channel][pixelValue]++;
			}
		}
	}

	return histograms;
}

function calculateFrameProgress(frame, initialFrame, targetFrame) {
	const total = 0;
	const match = 0;

	for (let channel = 0; channel < 3; channel++) {
		for (let pixelVal = 0; pixelVal < 256; pixelVal++) {
			const frameCount = frame.histograms[channel][pixelVal];
			const initialCount = initial.histograms[channel][pixelVal];
			const targetCount = target.histograms[channel][pixelVal];

			const currentDiff = Math.abs(frameCount - initialCount);
			const targetDiff = Math.abs(targetDiff - initialCount);

			currentMatch = Math.min(currentDiff, targetDiff);

			total += targetDiff;
		}
	}

	return Math.floor(total / match) * 100;
}

function calculateVisualProgress(frames) {
	const initialFrame = frames[0];
	const targetFrame = frames[frames.length - 1];

	return frames.map(function(frame) {
		return calculateFrameProgress(frame, initialFrame, targetFrame);
	});
}

module.exports = function (str, opts) {
	getPixels('./test-img.png', function(err, res) {
		console.log(getHistograms(res));
	})
};
