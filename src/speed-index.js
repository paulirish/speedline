'use strict';

const imageSSIM = require('image-ssim');

function calculateFrameProgress(current, initial, target) {
	let total = 0;
	let match = 0;

	const currentHist = current.getHistogram();
	const initialHist = initial.getHistogram();
	const targetHist = target.getHistogram();

	for (let channel = 0; channel < 3; channel++) {
		for (let pixelVal = 0; pixelVal < 256; pixelVal++) {
			const currentCount = currentHist[channel][pixelVal];
			const initialCount = initialHist[channel][pixelVal];
			const targetCount = targetHist[channel][pixelVal];

			const currentDiff = Math.abs(currentCount - initialCount);
			const targetDiff = Math.abs(targetCount - initialCount);

			match += Math.min(currentDiff, targetDiff);
			total += targetDiff;
		}
	}

	let progress;
	if (match === 0 && total === 0) {	// All images are the same
		progress = 100;
	} else {													// When images differs
		progress = Math.floor(match / total * 100);
	}
	return progress;
}

function calculateVisualProgress(frames) {
	const initial = frames[0];
	const target = frames[frames.length - 1];

	frames.forEach(function (frame) {
		const progress = calculateFrameProgress(frame, initial, target);
		frame.setProgress(progress);
	});

	return frames;
}

function calculateFrameSimilarity(frame, target) {
	const defaultImageConfig = {
		channels: 3
	};

	const frameData = Object.assign(frame.getParsedImage(), defaultImageConfig);
	const targetData = Object.assign(target.getParsedImage(), defaultImageConfig);

	const diff = imageSSIM.compare(frameData, targetData);
	return diff.ssim;
}

function calculatePercievedProgress(frames) {
	const target = frames[frames.length - 1];

	// Calculate frames simliarity between each frames and the final
	const framesSimilarity = frames
		.map(frame => calculateFrameSimilarity(frame, target));

	// Get the min frame similarity value
	const minPrecievedProgress = framesSimilarity
		.reduce((min, progress) => Math.min(min, progress), Infinity);

	// Remap the values from [minPrecievedProgress, 1], to [0, 100] interval
	// to be consistent with the standard visual progress
	framesSimilarity
		.map(progress => {
			const oldRange = 1 - minPrecievedProgress;
			return ((progress - minPrecievedProgress) * 100) / oldRange;
		})
		.forEach((progress, index) => frames[index].setPercievedProgress(progress));

	return frames;
}

function calculateSpeedIndexes(frames) {
	let speedIndex = 0;
	let percievedSpeedIndex = 0;

	let lastTs = frames[0].getTimeStamp();
	let lastProgress = frames[0].getProgress();
	let lastPercievedProgress = frames[0].getPercievedProgress();

	frames.forEach(function (frame) {
		const elapsed = frame.getTimeStamp() - lastTs;

		speedIndex += elapsed * (1 - lastProgress);
		percievedSpeedIndex += elapsed * (1 - lastPercievedProgress);

		lastTs = frame.getTimeStamp();
		lastProgress = frame.getProgress() / 100;
		lastPercievedProgress = frame.getPercievedProgress() / 100;
	});

	return {
		speedIndex,
		percievedSpeedIndex
	};
}

module.exports = {
	calculateVisualProgress,
	calculatePercievedProgress,
	calculateSpeedIndexes
};
