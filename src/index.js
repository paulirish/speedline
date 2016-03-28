'use strict';

const frame = require('./frame');
const speedIndex = require('./speed-index');

module.exports = function (timelinePath) {
	return frame.extractFramesFromTimeline(timelinePath)
		.then(speedIndex.calculateVisualProgress)
		.then(res => ({
			speedIndex: speedIndex.calculateSpeedIndex(res),
			frames: res
		}));
};
