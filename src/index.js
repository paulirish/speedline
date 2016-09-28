'use strict';

const frame = require('./frame');
const SI = require('./speed-index');

const calculateVisualProgress = SI.calculateVisualProgress;
const calculateSpeedIndexes = SI.calculateSpeedIndexes;
const calculatePerceptualProgress = SI.calculatePerceptualProgress;


function calculateValues(framesObj) {
	const startTs = framesObj.startTs;
	const endTs = framesObj.endTs;
	const duration = Math.floor(endTs - startTs);

	const frames = framesObj.allFrames;

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

	let {speedIndex, perceptualSpeedIndex} = calculateSpeedIndexes(framesObj);

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
	return frame.extractFramesFromTimeline(timeline).then(function (framesObj) {
		if (framesObj.allFrames.length === 0) {
			throw new Error('No screenshots found in trace');
		}
		calculateVisualProgress(framesObj);
		calculatePerceptualProgress(framesObj);
		return calculateValues(framesObj);
	});
};
