'use strict';

var imageSSIM = require('image-ssim');

function calculateFrameProgress(current, initial, target) {
	var total = 0;
	var match = 0;

	var currentHist = current.getHistogram();
	var initialHist = initial.getHistogram();
	var targetHist = target.getHistogram();

	for (var channel = 0; channel < 3; channel++) {
		for (var pixelVal = 0; pixelVal < 256; pixelVal++) {
			var currentCount = currentHist[channel][pixelVal];
			var initialCount = initialHist[channel][pixelVal];
			var targetCount = targetHist[channel][pixelVal];

			var currentDiff = Math.abs(currentCount - initialCount);
			var targetDiff = Math.abs(targetCount - initialCount);

			match += Math.min(currentDiff, targetDiff);
			total += targetDiff;
		}
	}

	var progress = void 0;
	if (match === 0 && total === 0) {
		// All images are the same
		progress = 100;
	} else {
		// When images differs
		progress = Math.floor(match / total * 100);
	}
	return progress;
}

function calculateVisualProgress(frames) {
	var initial = frames[0];
	var target = frames[frames.length - 1];

	frames.forEach(function (frame) {
		var progress = calculateFrameProgress(frame, initial, target);
		frame.setProgress(progress);
	});

	return frames;
}

function calculateFrameSimilarity(frame, target) {
	var defaultImageConfig = {
		channels: 3
	};

	var frameData = Object.assign(frame.getParsedImage(), defaultImageConfig);
	var targetData = Object.assign(target.getParsedImage(), defaultImageConfig);

	var diff = imageSSIM.compare(frameData, targetData);
	return diff.ssim;
}

function calculatePerceptualProgress(frames) {
	var target = frames[frames.length - 1];

	// Calculate frames simliarity between each frames and the final
	var framesSimilarity = frames.map(function (frame) {
		return calculateFrameSimilarity(frame, target);
	});

	// Get the min frame similarity value
	var minPreceptualProgress = framesSimilarity.reduce(function (min, progress) {
		return Math.min(min, progress);
	}, Infinity);

	// Remap the values from [minPreceptualProgress, 1], to [0, 100] interval
	// to be consistent with the standard visual progress
	framesSimilarity.map(function (progress) {
		var oldRange = 1 - minPreceptualProgress;
		return (progress - minPreceptualProgress) * 100 / oldRange;
	}).forEach(function (progress, index) {
		return frames[index].setPerceptualProgress(progress);
	});

	return frames;
}

function calculateSpeedIndexes(frames) {
	var speedIndex = 0;
	var perceptualSpeedIndex = 0;

	var lastTs = frames[0].getTimeStamp();
	var lastProgress = frames[0].getProgress();
	var lastPerceptualProgress = frames[0].getPerceptualProgress();

	frames.forEach(function (frame) {
		var elapsed = frame.getTimeStamp() - lastTs;

		speedIndex += elapsed * (1 - lastProgress);
		perceptualSpeedIndex += elapsed * (1 - lastPerceptualProgress);

		lastTs = frame.getTimeStamp();
		lastProgress = frame.getProgress() / 100;
		lastPerceptualProgress = frame.getPerceptualProgress() / 100;
	});

	return {
		speedIndex: speedIndex,
		perceptualSpeedIndex: perceptualSpeedIndex
	};
}

module.exports = {
	calculateVisualProgress: calculateVisualProgress,
	calculatePerceptualProgress: calculatePerceptualProgress,
	calculateSpeedIndexes: calculateSpeedIndexes
};