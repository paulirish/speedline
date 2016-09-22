'use strict';

var _frame = require('./frame');

var _frame2 = _interopRequireDefault(_frame);

var _speedIndex = require('./speed-index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function calculateValues(frames) {
	var startTs = frames[0].params.timestamp;
	var endTs = frames[frames.length - 1].params.timestamp;
	var duration = Math.floor(endTs - startTs);

	var first = void 0;
	for (var _i = 0; _i < frames.length && !first; _i++) {
		if (frames[_i].params.encodedDataLength > 0) {
			first = Math.floor(frames[_i].params.timestamp - startTs);
		}
	}

	return {
		frames: frames,
		first: first,
		start: startTs,
		end: endTs,
		duration: duration
	};
}

/**
 * Retrieve speed index informations
 * @param  {string|Array|DevtoolsTimelineModel} timeline
 * @return {Promise} resolving with an object containing the speed index informations
 */
module.exports = function (timeline) {
	return _frame2.default.extractPacketsFromTimeline(timeline).then(function (frames) {
		// (0, _speedIndex.calculateVisualProgress)(frames);

		return calculateValues(frames);
	});
};
