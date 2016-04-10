'use strict';

import frame from './frame';
import speedIndex from './speed-index';

function calculateValues(frames) {
	const startTs = frames[0].getTimeStamp();
	const endTs = frames[frames.length - 1].getTimeStamp();
	const duration = Math.floor(endTs - startTs);

	let complete;
	for (let i = 0; i < frames.length && !complete; i++) {
		if (frames[i].getProgress() >= 100) {
			complete = Math.floor(frames[i].getTimeStamp() - startTs);
		}
	}

	let first;
	for (let i = 0; i < frames.length && !first; i++) {
		if (frames[i].getProgress() > 0) {
			first = Math.floor(frames[i].getTimeStamp() - startTs);
		}
	}

	return {
		frames,
		first,
		complete,
		duration,
		speedIndex: Math.floor(speedIndex.calculateSpeedIndex(frames))
	};
}

module.exports = function (timelinePath) {
	return frame.extractFramesFromTimeline(timelinePath)
		.then(speedIndex.calculateVisualProgress)
		.then(calculateValues);
};
