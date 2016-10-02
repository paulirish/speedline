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

function calculatePerceptualProgress(frames) {
	const target = frames[frames.length - 1];

	// Calculate frames simliarity between each frames and the final
	const framesSimilarity = frames
		.map(frame => calculateFrameSimilarity(frame, target));

	// Get the min frame similarity value
	const minPreceptualProgress = framesSimilarity
		.reduce((min, progress) => Math.min(min, progress), Infinity);

	// Remap the values from [minPreceptualProgress, 1], to [0, 100] interval
	// to be consistent with the standard visual progress
	const normalizedSimilarity = framesSimilarity
		.map(progress => {
			if (progress === minPreceptualProgress) { // Images are the same
				return 0;
			}
			const oldRange = 1 - minPreceptualProgress;
			return ((progress - minPreceptualProgress) * 100) / oldRange;
		});

	normalizedSimilarity
		.forEach((progress, index) => frames[index].setPerceptualProgress(progress));

	return frames;
}

function calculateSpeedIndexes(frames, data) {
	const startTs = data.startTs;
	let visuallyCompleteTs;
	let firstPaintTs;

	// find first paint
	for (let i = 0; i < frames.length && !firstPaintTs; i++) {
		if (frames[i].getProgress() > 0) {
			firstPaintTs = frames[i].getTimeStamp();
		}
	}

	// find visually complete
	for (let i = 0; i < frames.length && !visuallyCompleteTs; i++) {
		if (frames[i].getProgress() >= 100) {
			visuallyCompleteTs = frames[i].getTimeStamp();
		}
	}

	let prevFrameTs = frames[0].getTimeStamp();
	let prevProgress = frames[0].getProgress();
	let prevPerceptualProgress = frames[0].getPerceptualProgress();

	// SI = firstPaint + sum(fP to VC){1-VC%}
	//     github.com/pmdartus/speedline/issues/28#issuecomment-244127192
	let speedIndex = firstPaintTs - startTs;
	let perceptualSpeedIndex = firstPaintTs - startTs;

	frames.forEach(function (frame) {
		// skip frames from 0 to fP
		if (frame.getTimeStamp() > firstPaintTs) {
			const elapsed = frame.getTimeStamp() - prevFrameTs;
			speedIndex += elapsed * (1 - prevProgress);
			perceptualSpeedIndex += elapsed * (1 - prevPerceptualProgress);
		}

		prevFrameTs = frame.getTimeStamp();
		prevProgress = frame.getProgress() / 100;
		prevPerceptualProgress = frame.getPerceptualProgress() / 100;
	});

	return {
		firstPaintTs,
		visuallyCompleteTs,
		speedIndex,
		perceptualSpeedIndex
	};
}

module.exports = {
	calculateVisualProgress,
	calculatePerceptualProgress,
	calculateSpeedIndexes
};
