'use strict';

var _fs = require('fs');
var fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _jpegJs = require('jpeg-js');

var _jpegJs2 = _interopRequireDefault(_jpegJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function getPixel(x, y, channel, width, buff) {
	return buff[(x + y * width) * 4 + channel];
}

function convertPixelsToHistogram(img) {
	var createHistogramArray = function createHistogramArray() {
		var ret = new Array(256);
		for (var i = 0; i < ret.length; i++) {
			ret[i] = 0;
		}
		return ret;
	};

	var width = img.width;
	var height = img.height;

	var histograms = [createHistogramArray(), createHistogramArray(), createHistogramArray()];

	for (var channel = 0; channel < histograms.length; channel++) {
		for (var i = 0; i < width; i++) {
			for (var j = 0; j < height; j++) {
				var pixelValue = getPixel(i, j, channel, width, img.data);

				// Erase pixels considered as white
				if (getPixel(i, j, 0, width, img.data) < 249 && getPixel(i, j, 1, width, img.data) < 249 && getPixel(i, j, 2, width, img.data) < 249) {
					histograms[channel][pixelValue]++;
				}
			}
		}
	}

	return histograms;
}

function extractPacketsFromTimeline(timeline) {

  let trace;
	trace = typeof timeline === 'string' ? fs.readFileSync(timeline, 'utf-8') : timeline;
	try {
			trace = typeof trace === 'string' ? JSON.parse(trace) : trace;
	} catch (e) {
			throw new Error('Speedline: Invalid JSON' + e.message);
	}

	const events = trace.filter(e => e.method === 'Network.dataReceived');
	return Promise.resolve(events);
}

function frame(imgBuff, ts) {
	var _histogram = null;
	var _progress = null;
	var _perceptualProgress = null;

	return {
		getHistogram: function getHistogram() {
			if (_histogram) {
				return _histogram;
			}

			var pixels = _jpegJs2.default.decode(imgBuff);
			_histogram = convertPixelsToHistogram(pixels);
			return _histogram;
		},

		getTimeStamp: function getTimeStamp() {
			return ts;
		},

		setProgress: function setProgress(progress) {
			_progress = progress;
		},

		setPerceptualProgress: function setPerceptualProgress(progress) {
			_perceptualProgress = progress;
		},

		getImage: function getImage() {
			return imgBuff;
		},

		getParsedImage: function getParsedImage() {
			return _jpegJs2.default.decode(imgBuff);
		},

		getProgress: function getProgress() {
			return _progress;
		},

		getPerceptualProgress: function getPerceptualProgress() {
			return _perceptualProgress;
		}
	};
}

module.exports = {
	extractPacketsFromTimeline: extractPacketsFromTimeline,
	create: frame
};
