'use strict';

import frame from './frame';
import {
	calculateVisualProgress,
	calculateSpeedIndex
} from './speed-index';

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
		speedIndex: Math.floor(calculateSpeedIndex(frames))
	};
}

/**
 * Retrieve speed index informations
 * @param  {string|Array} timeline path to the timeline to process, or the frames JSON
 * @return {Promise} resoving with an object containing the speed index informations
 */

module.exports = function (timeline) {
	console.time('extract');
	return frame.extractFramesFromTimeline(timeline).then(function (frames) {
		console.timeEnd('extract');
		console.time('progress');
		calculateVisualProgress(frames);
		console.timeEnd('progress');
		return calculateValues(frames);
	});
};
