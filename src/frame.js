'use strict';

import fs from 'fs';
import jpeg from 'jpeg-js';
import DevtoolsTimelineModel from 'devtools-timeline-model';

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

function extractFramesFromTimeline(timeline) {
	const trace = typeof timeline === 'string' ? fs.readFileSync(timeline, 'utf-8') : timeline;

	const model = new DevtoolsTimelineModel(trace);
	const rawFrames = model.filmStripModel().frames();

	const timelineModel = model.timelineModel();
	const start = timelineModel.minimumRecordTime();
	const end = timelineModel.maximumRecordTime();

	return Promise.all(rawFrames.map(f => f.imageDataPromise())).then(ret => {
		return Promise.all(ret.map(function (img, index) {
			const imgBuff = new Buffer(img, 'base64');
			return frame(imgBuff, rawFrames[index].timestamp);
		}))
		.then(function (frames) {
			const firstFrame = frame(frames[0].getImage(), start);
			const lastFrame = frame(frames[frames.length - 1].getImage(), end);

			return [firstFrame, ...frames, lastFrame];
		});
	});
}

function frame(imgBuff, ts) {
	let _histogram = null;
	let _progress = null;
	let _perceptualProgress = null;

	return {
		getHistogram: function () {
			if (_histogram) {
				return _histogram;
			}

			const pixels = jpeg.decode(imgBuff);
			_histogram = convertPixelsToHistogram(pixels);
			return _histogram;
		},

		getTimeStamp: function () {
			return ts;
		},

		setProgress: function (progress) {
			_progress = progress;
		},

		setPerceptualProgress: function (progress) {
			_perceptualProgress = progress;
		},

		getImage: function () {
			return imgBuff;
		},

		getParsedImage: function () {
			return jpeg.decode(imgBuff);
		},

		getProgress: function () {
			return _progress;
		},

		getPerceptualProgress: function () {
			return _perceptualProgress;
		}
	};
}

module.exports = {
	extractFramesFromTimeline,
	create: frame
};
