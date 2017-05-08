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

function calculateProgressBetweenFrames(frames, lowerBound, upperBound, threshold, getProgress, setProgress) {
	if (threshold === 0) {
		frames.forEach(frame => setProgress(frame, getProgress(frame)));
		return;
	}

	const lowerFrame = frames[lowerBound];
	const upperFrame = frames[upperBound];

	const lowerProgress = getProgress(lowerFrame);
	const upperProgress = getProgress(upperFrame);

	setProgress(lowerFrame, lowerProgress);
	setProgress(upperFrame, upperProgress);

	if (Math.abs(lowerProgress - upperProgress) < threshold) {
		for (let i = lowerBound; i < upperBound; i++) {
			setProgress(frames[i], lowerProgress);
		}
	} else if (upperBound - lowerBound > 1) {
		const midpoint = Math.floor((lowerBound + upperBound) / 2);
		calculateProgressBetweenFrames(frames, lowerBound, midpoint, threshold, getProgress, setProgress);
		calculateProgressBetweenFrames(frames, midpoint, upperBound, threshold, getProgress, setProgress);
	}
}

function calculateVisualProgress(frames, opts) {
	const initial = frames[0];
	const target = frames[frames.length - 1];

	calculateProgressBetweenFrames(
		frames,
		0,
		frames.length - 1,
		opts && opts.fast ? 5 : 0,
		frame => frame.getProgress() || calculateFrameProgress(frame, initial, target),
		(frame, progress) => frame.setProgress(progress)
	);

	return frames;
}

function calculateFrameSimilarity(frame, target) {
	const defaultImageConfig = {
		// image-ssim uses this to interpret the arraybuffer NOT the desired channels to consider
		// jpeg-js encodes each pixel with an alpha channel set to 0xFF, so 4 channel interpretation is required
		channels: 4
	};

	const frameData = Object.assign(frame.getParsedImage(), defaultImageConfig);
	const targetData = Object.assign(target.getParsedImage(), defaultImageConfig);

	const diff = imageSSIM.compare(frameData, targetData);
	return diff.ssim;
}

function calculatePerceptualProgress(frames, opts) {
	const initial = frames[0];
	const target = frames[frames.length - 1];
	const initialSimilarity = calculateFrameSimilarity(initial, target);

	calculateProgressBetweenFrames(
		frames,
		0,
		frames.length - 1,
		opts && opts.fast ? 5 : 0,
		frame => {
			if (frame.getPerceptualProgress()) {
				return frame.getPerceptualProgress();
			}

			const ssim = calculateFrameSimilarity(frame, target);
			return Math.max(100 * (ssim - initialSimilarity) / (1 - initialSimilarity), 0);
		},
		(frame, progress) => frame.setPerceptualProgress(progress)
	);

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
	calculateFrameSimilarity,
	calculateVisualProgress,
	calculatePerceptualProgress,
	calculateSpeedIndexes
};
