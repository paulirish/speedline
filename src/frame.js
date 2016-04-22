'use strict';

import fs from 'fs';
import getPixelsCb from 'get-pixels';
import DevtoolsTimelineModel from 'devtools-timeline-model';

const getPixels = (buff, type) => {
	return new Promise((resolve, reject) => {
		getPixelsCb(buff, type, (err, v) => {
			if (err) {
				return reject(err);
			}
			resolve(v);
		});
	});
};

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

function convertJPGToHistogram(imgBuff) {
	return getPixels(imgBuff, 'image/jpg')
		.then(convertPixelsToHistogram);
}

function extractFramesFromTimeline(timelinePath) {
	const trace = fs.readFileSync(timelinePath, 'utf-8');

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

	return {
		getHistogram: function () {
			return Promise.resolve().then(() => {
				if (_histogram) {
					return _histogram;
				}

				return convertJPGToHistogram(imgBuff).then(function (histogram) {
					_histogram = histogram;
					return _histogram;
				});
			});
		},

		getTimeStamp: function () {
			return ts;
		},

		setProgress: function (progress) {
			_progress = progress;
		},

		getImage: function () {
			return imgBuff;
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
