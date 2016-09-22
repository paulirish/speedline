'use strict';

import frame from './frame';
import {
	calculateVisualProgress,
	calculateSpeedIndexes,
	calculatePerceptualProgress
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

	const {speedIndex, perceptualSpeedIndex} = calculateSpeedIndexes(frames);

	return {
		frames,
		first,
		complete,
		duration,
		speedIndex,
		perceptualSpeedIndex
	};
}

/**
 * Retrieve speed index informations
 * @param  {string|Array|DevtoolsTimelineModel} timeline
 * @return {Promise} resolving with an object containing the speed index informations
 */
module.exports = function (timeline) {
	return frame.extractPacketsFromTimeline(timeline).then(function (frames) {
		console.error('sdfs', frames.length)
		calculateVisualProgress(frames);
		calculatePerceptualProgress(frames);
		return calculateValues(frames);
	});
};
