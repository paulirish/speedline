'use strict';

const fs = require('fs');
// const jpeg = require('jpeg-js');
const wasmJpeg = require('../../../../rust/wasm-jpeg/dist/index.js');

/**
 * @typedef {import('../speedline').IncludeType} IncludeType
 * @typedef {import('../speedline').Options<IncludeType>} Options
 * @typedef {import('../speedline').TraceEvent} TraceEvent
 * @typedef {{data: Buffer, width: number, height: number}} ImageData
 */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} channel
 * @param {number} width
 * @param {Buffer} buff
 */
function getPixel(x, y, channel, width, buff) {
	return buff[(x + y * width) * 3 + channel];
}

/**
 * @param {number} i
 * @param {number} j
 * @param {ImageData} img
 */
function isWhitePixel(i, j, img) {
	return getPixel(i, j, 0, img.width, img.data) >= 249 &&
			getPixel(i, j, 1, img.width, img.data) >= 249 &&
			getPixel(i, j, 2, img.width, img.data) >= 249;
}

/** @param {ImageData} img */
function convertPixelsToHistogram(img) {
	const createHistogramArray = function () {
		const ret = [];
		for (let i = 0; i < 256; i++) {
			ret[i] = 0;
		}
		return ret;
	};

	const width = img.width;
	const height = img.height;

	const histograms = [
		createHistogramArray(),
		createHistogramArray(),
		createHistogramArray()
	];

	for (let j = 0; j < height; j++) {
		for (let i = 0; i < width; i++) {
			// Erase pixels considered as white
			if (isWhitePixel(i, j, img)) {
				continue;
			}

			for (let channel = 0; channel < histograms.length; channel++) {
				const pixelValue = getPixel(i, j, channel, width, img.data);
				histograms[channel][pixelValue]++;
			}
		}
	}

	return histograms;
}

class Frame {
	/**
	 * @param {Buffer} imgBuff
	 * @param {number} ts
	 */
	constructor(imgBuff, ts) {
		this._imgBuff = imgBuff;
		this._ts = ts;

		/** @type {?Array<Array<number>>} */
		this._histogram = null;
		/** @type {?number} */
		this._progress = null;
		/** @type {?boolean} */
		this._isProgressInterpolated = null;
		/** @type {?number} */
		this._perceptualProgress = null;
		/** @type {?boolean} */
		this._isPerceptualProgressInterpolated = null;
		/** @type {?ImageData} */
		this._parsedImage = null;
	}

	getHistogram() {
		if (this._histogram) {
			return this._histogram;
		}

		const pixels = this.getParsedImage();
		this._histogram = convertPixelsToHistogram(pixels);
		return this._histogram;
	}

	getTimeStamp() {
		return this._ts;
	}

	/**
	 * @param {number} progress
	 * @param {boolean=} isInterpolated
	 */
	setProgress(progress, isInterpolated) {
		this._progress = progress;
		this._isProgressInterpolated = Boolean(isInterpolated);
	}

	/**
	 * @param {number} progress
	 * @param {boolean=} isInterpolated
	 */
	setPerceptualProgress(progress, isInterpolated) {
		this._perceptualProgress = progress;
		this._isPerceptualProgressInterpolated = Boolean(isInterpolated);
	}

	getImage() {
		return this._imgBuff;
	}

	getParsedImage() {
		if (!this._parsedImage) {
			this._parsedImage = wasmJpeg.decode(this._imgBuff);
		}
		return this._parsedImage;
	}

	getProgress() {
		return this._progress;
	}

	isProgressInterpolated() {
		return this._isProgressInterpolated;
	}

	getPerceptualProgress() {
		return this._perceptualProgress;
	}

	isPerceptualProgressInterpolated() {
		return this._isPerceptualProgressInterpolated;
	}
}

/**
 * @param {Array<Frame>} frames
 * @param {number} startTs
 * @return {Frame}
 */
function synthesizeWhiteFrame(frames, startTs) {
	const firstImageData = wasmJpeg.decode(frames[0].getImage());
	const width = firstImageData.width;
	const height = firstImageData.height;

	const frameData = Buffer.alloc(width * height * 3, 0xFF);

	var parsedWhiteFrame = {
		data: frameData,
		width: width,
		height: height
	};
	const whiteFrame = new Frame(Buffer.alloc(0), startTs);
	whiteFrame._parsedImage = parsedWhiteFrame;

	return whiteFrame;
}

const screenshotTraceCategory = 'disabled-by-default-devtools.screenshot';

/**
 * @param {string|Array<TraceEvent>|{traceEvents: Array<TraceEvent>}} timeline
 * @param {Options} opts
 */
function extractFramesFromTimeline(timeline, opts) {
	opts = opts || {};
	/** @type {Array<TraceEvent>|{traceEvents: Array<TraceEvent>}} */
	let trace;
	timeline = typeof timeline === 'string' ? fs.readFileSync(timeline, 'utf-8') : timeline;
	try {
		trace = typeof timeline === 'string' ? JSON.parse(timeline) : timeline;
	} catch (e) {
		throw new Error('Speedline: Invalid JSON' + e.message);
	}
	/** @type {Array<TraceEvent>} */
	let events = trace.traceEvents || trace;
	events = events.sort((a, b) => a.ts - b.ts).filter(e => e.ts !== 0);

	const startTs = (opts.timeOrigin || events[0].ts) / 1000;
	const endTs = events[events.length - 1].ts / 1000;

	/** @type {?string} */
	let lastFrame = null;
	const rawScreenshots = events.filter(e => e.cat.includes(screenshotTraceCategory) && e.ts >= startTs * 1000);
	/** @type {Array<Frame>} */
	const uniqueFrames = rawScreenshots.map(function (evt) {
		const base64img = evt.args && evt.args.snapshot;
		const timestamp = evt.ts / 1000;

		if (base64img === lastFrame) {
			return null;
		}

		lastFrame = base64img;
		const imgBuff = Buffer.from(base64img, 'base64');
		return new Frame(imgBuff, timestamp);
	}).filter(Boolean);

	if (uniqueFrames.length === 0) {
		return Promise.reject(new Error('No screenshots found in trace'));
	}
	// add white frame to beginning of trace
	const fakeWhiteFrame = synthesizeWhiteFrame(uniqueFrames, startTs);
	uniqueFrames.unshift(fakeWhiteFrame);

	const data = {
		startTs,
		endTs,
		frames: uniqueFrames
	};
	return Promise.resolve(data);
}

/**
 * @param {Buffer} imgBuff
 * @param {number} ts
 */
const create = (imgBuff, ts) => new Frame(imgBuff, ts);

module.exports = {
	extractFramesFromTimeline,
	create
};
