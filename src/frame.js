'use strict';

const fs = require('fs');
const jpeg = require('jpeg-js');

function getPixel(x, y, channel, width, buff) {
	return buff[(x + y * width) * 4 + channel];
}

function convertPixelsToHistogram(img) {
	const createHistogramArray = function () {
		const ret = new Array(256);
		for (let i = 0; i < ret.length; i++) {
			ret[i] = 0;
		}
		return ret;
	};

	const width = img.width;
	const height = img.height;

	const histograms = [
		createHistogramArray(),
		createHistogramArray(),
		createHistogramArray()
	];

	for (let channel = 0; channel < histograms.length; channel++) {
		for (let i = 0; i < width; i++) {
			for (let j = 0; j < height; j++) {
				const pixelValue = getPixel(i, j, channel, width, img.data);

				// Erase pixels considered as white
				if (getPixel(i, j, 0, width, img.data) < 249 &&
						getPixel(i, j, 1, width, img.data) < 249 &&
						getPixel(i, j, 2, width, img.data) < 249) {
					histograms[channel][pixelValue]++;
				}
			}
		}
	}

	return histograms;
}

function synthesizeWhiteFrame(frames) {
	const firstImageData = jpeg.decode(frames[0].getImage());
	const width = firstImageData.width;
	const height = firstImageData.height;

	const frameData = new Buffer(width * height * 4);
	let i = 0;
	while (i < frameData.length) {
		frameData[i++] = 0xFF; // red
		frameData[i++] = 0xFF; // green
		frameData[i++] = 0xFF; // blue
		frameData[i++] = 0xFF; // alpha - ignored in JPEGs
	}

	var jpegImageData = jpeg.encode({
		data: frameData,
		width: width,
		height: height
	});
	return jpegImageData.data;
}

const screenshotTraceCategory = 'disabled-by-default-devtools.screenshot';
function extractFramesFromTimeline(timeline, opts) {
	opts = opts || {};
	let trace;
	trace = typeof timeline === 'string' ? fs.readFileSync(timeline, 'utf-8') : timeline;
	try {
		trace = typeof trace === 'string' ? JSON.parse(trace) : trace;
	} catch (e) {
		throw new Error('Speedline: Invalid JSON' + e.message);
	}
	let events = trace.traceEvents || trace;
	events = events.sort((a, b) => a.ts - b.ts).filter(e => e.ts !== 0);

	const startTs = (opts.timeOrigin || events[0].ts) / 1000;
	const endTs = events[events.length - 1].ts / 1000;

	const rawScreenshots = events.filter(e => e.cat.includes(screenshotTraceCategory) && e.ts >= startTs * 1000);
	const frames = rawScreenshots.map(function (evt) {
		const base64img = evt.args && evt.args.snapshot;
		const timestamp = evt.ts / 1000;

		const imgBuff = new Buffer(base64img, 'base64');
		return frame(imgBuff, timestamp);
	});

	if (frames.length === 0) {
		return Promise.reject(new Error('No screenshots found in trace'));
	}
	// add white frame to beginning of trace
	const fakeWhiteFrame = frame(synthesizeWhiteFrame(frames), startTs);
	frames.unshift(fakeWhiteFrame);

	const data = {
		startTs,
		endTs,
		frames: frames
	};
	return Promise.resolve(data);
}

function frame(imgBuff, ts) {
	let _histogram = null;
	let _progress = null;
	let _isProgressInterpolated = null;
	let _perceptualProgress = null;
	let _isPerceptualProgressInterpolated = null;
	let _parsedImage = null;

	return {
		getHistogram: function () {
			if (_histogram) {
				return _histogram;
			}

			const pixels = this.getParsedImage();
			_histogram = convertPixelsToHistogram(pixels);
			return _histogram;
		},

		getTimeStamp: function () {
			return ts;
		},

		setProgress: function (progress, isInterpolated) {
			_progress = progress;
			_isProgressInterpolated = Boolean(isInterpolated);
		},

		setPerceptualProgress: function (progress, isInterpolated) {
			_perceptualProgress = progress;
			_isPerceptualProgressInterpolated = Boolean(isInterpolated);
		},

		getImage: function () {
			return imgBuff;
		},

		getParsedImage: function () {
			if (!_parsedImage) {
				_parsedImage = jpeg.decode(imgBuff);
			}
			return _parsedImage;
		},

		getProgress: function () {
			return _progress;
		},

		isProgressInterpolated: function () {
			return _isProgressInterpolated;
		},

		getPerceptualProgress: function () {
			return _perceptualProgress;
		},

		isPerceptualProgressInterpolated: function () {
			return _isPerceptualProgressInterpolated;
		}
	};
}

module.exports = {
	extractFramesFromTimeline,
	create: frame
};
