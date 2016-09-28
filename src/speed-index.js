'use strict';

const imageSSIM = require('image-ssim');

const fs = require('fs');

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
	const target = frames.slice(-1)[0];

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
	const target = frames.slice(-1)[0];

	//  fs.writeFileSync(`targetframe-${Date.now()}.jpg`, frames.lastFrame.getImage(), 'base64');

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

function calculateSpeedIndexes(frames) {
	let speedIndex = 0;
	let perceptualSpeedIndex = 0;

	let prevFrameTs = frames[0].getTimeStamp();
	let prevProgress = frames[0].getProgress();
	let prevPerceptualProgress = frames[0].getPerceptualProgress();

	if (frames.length === 1) {
		return {
			speedIndex: prevFrameTs,
			perceptualSpeedIndex: prevFrameTs
		};
	}

	frames.forEach(function (frame) {
		const elapsed = frame.getTimeStamp() - prevFrameTs;

		speedIndex += elapsed * (1 - prevProgress);
		perceptualSpeedIndex += elapsed * (1 - prevPerceptualProgress);

		prevFrameTs = frame.getTimeStamp();
		prevProgress = frame.getProgress() / 100;
		prevPerceptualProgress = frame.getPerceptualProgress() / 100;
	});

	return {
		speedIndex,
		perceptualSpeedIndex
	};
}

module.exports = {
	calculateVisualProgress,
	calculatePerceptualProgress,
	calculateSpeedIndexes
};
