'use strict';

const frame = require('./frame');
const speedIndex = require('./speed-index');

function calculateValues(frames, data) {
	const indexes = speedIndex.calculateSpeedIndexes(frames, data);
	const duration = Math.floor(data.endTs - data.startTs);
	const first = Math.floor(indexes.firstPaintTs - data.startTs);
	const complete = Math.floor(indexes.visuallyCompleteTs - data.startTs);

	return {
		beginning: data.startTs,
		end: data.endTs,
		frames,
		first,
		complete,
		duration,
		speedIndex: indexes.speedIndex,
		perceptualSpeedIndex: indexes.perceptualSpeedIndex
	};
}

const Include = {
	All: 'all',
	pSI: 'perceptualSpeedIndex',
	SI: 'speedIndex'
};

/**
 * Retrieve speed index informations
 * @param  {string|Array|DevtoolsTimelineModel} timeline
 * @param  {?Object} opts
 * @return {Promise} resolving with an object containing the speed index informations
 */
module.exports = function (timeline, opts) {
	const include = opts && opts.include || Include.All;
	// Check for invalid `include` values
	if (!Object.keys(Include).some(key => Include[key] === include)) {
		throw new Error(`Unrecognized include option: ${include}`);
	}

	return frame.extractFramesFromTimeline(timeline, opts).then(function (data) {
		const frames = data.frames;

		if (include === Include.All || include === Include.SI) {
			speedIndex.calculateVisualProgress(frames, opts);
		}

		if (include === Include.All || include === Include.pSI) {
			speedIndex.calculatePerceptualProgress(frames, opts);
		}

		return calculateValues(frames, data);
	});
};
