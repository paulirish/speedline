'use strict';

const frame = require('./frame');
const SI = require('./speed-index');

const calculateVisualProgress = SI.calculateVisualProgress;
const calculateSpeedIndexes = SI.calculateSpeedIndexes;
const calculatePerceptualProgress = SI.calculatePerceptualProgress;

function calculateValues(frames, data) {
	const startTs = data.startTs;
	const endTs = data.endTs;
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

	const indexes = calculateSpeedIndexes(frames);
	let speedIndex = indexes.speedIndex;
	let perceptualSpeedIndex = indexes.perceptualSpeedIndex;

	if (frames.length === 1) {
		speedIndex = perceptualSpeedIndex = first;
	}

	return {
		beginning: startTs,
		end: endTs,
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
	return frame.extractFramesFromTimeline(timeline).then(function (data) {
		const frames = data.frames;
		calculateVisualProgress(frames);
		calculatePerceptualProgress(frames);
		return calculateValues(frames, data);
	});
};
