'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const DevtoolsTimelineModel = require('devtools-timeline-model');

const frame = require('./frame');

function calculateFrameProgress(current, initial, target) {
	const props = {
		current: current.getHistogram(),
		initial: initial.getHistogram(),
		target: target.getHistogram(),
	};

	return Promise.props(props).then(function(results) {
		let total = 0;
		let match = 0;

		for (let channel = 0; channel < 3; channel++) {
			for (let pixelVal = 0; pixelVal < 256; pixelVal++) {
				const currentCount = results.current[channel][pixelVal];
				const initialCount = results.initial[channel][pixelVal];
				const targetCount = results.target[channel][pixelVal];

				const currentDiff = Math.abs(currentCount - initialCount);
				const targetDiff = Math.abs(targetCount - initialCount);

				match += Math.min(currentDiff, targetDiff);
				total += targetDiff;
			}
		}

		return Math.floor(match/ total * 100);
	});
}

function calculateVisualProgress(frames) {
	const initial = frames[0];
	const target = frames[frames.length - 1];

	return Promise.map(frames, f => calculateFrameProgress(f, initial, target))
		.map((progress, index) => ({
			progress,
			frame: frames[index],
		}));
}

function extractFramesFromTimeline(timelinePath) {
	const trace = fs.readFileSync(timelinePath, 'utf-8');

	const model = new DevtoolsTimelineModel(trace);
	const rawFrames = model.filmStripModel().frames();

	return Promise.map(rawFrames, f => f.imageDataPromise())
		.map(function(img, index) {
			const imgBuff = new Buffer(img, 'base64');
			return frame(imgBuff, rawFrames[index].timestamp);
		});
}

module.exports = function (str, opts) {
	const timelinePath = '/Users/p.dartus/Downloads/techcrunch.json';
	return extractFramesFromTimeline(timelinePath)
		.then(calculateVisualProgress)
		.then(function (res) {
			console.log(res);
		});
};
