import fs from 'fs';
import test from 'ava';

import frame from '../src/frame';
import speedIndex from '../src/speed-index';

function calculateVisualProgressFromImages(images = [], delay = 1000) {
	const startTs = new Date().getTime();

	const frames = images.map((imgPath, i) => {
		const imgBuff = fs.readFileSync(imgPath);
		return frame.create(imgBuff, startTs + i * delay);
	});

	return {
		startTs,
		frames: speedIndex.calculateVisualProgress(frames)
	};
}

test('fast mode allowable change shrinks over time', t => {
	t.is(speedIndex.calculateFastModeAllowableChange(0), 5);
	t.is(speedIndex.calculateFastModeAllowableChange(1000), 3);
	t.true(speedIndex.calculateFastModeAllowableChange(10000) - 1 < 0);
});

test('frame similarity should reflect SSIM', async t => {
	const data = calculateVisualProgressFromImages([
		'./test/assets/frameA.jpg',
		'./test/assets/frameC.jpg'
	]);

	const similarity = speedIndex.calculateFrameSimilarity(data.frames[0], data.frames[1]);
	t.is(Math.floor(similarity * 100), 78);
	// You should be able to reproduce this result (78) on http://darosh.github.io/image-ssim-js/test/browser_test.html
	// However, you'll need some hacks: https://github.com/pmdartus/speedline/pull/42/files#r112545467
});

test('visual progress should be 100 if there is a single frame only', async t => {
	const data = calculateVisualProgressFromImages(['./test/assets/grayscale.jpg']);
	t.is(data.frames[0].getProgress(), 100);
});

test('visual progress should be 100 if there is not change', async t => {
	const data = calculateVisualProgressFromImages([
		'./test/assets/grayscale.jpg',
		'./test/assets/grayscale.jpg'
	]);

	for (const frame of data.frames) {
		t.is(frame.getProgress(), 100);
	}
});

test('visual progress should have 0 and 100 for different images', async t => {
	const data = calculateVisualProgressFromImages([
		'./test/assets/Solid_black.jpg',
		'./test/assets/grayscale.jpg'
	]);

	t.is(data.frames[0].getProgress(), 0);
	t.is(data.frames[1].getProgress(), 100);
});

test('perceptual progress should use SSIM', async t => {
	const data = calculateVisualProgressFromImages([
		'./test/assets/frameWhite.jpg',
		'./test/assets/frameA.jpg',
		'./test/assets/frameB.jpg',
		'./test/assets/frameC.jpg'
	]);

	speedIndex.calculatePerceptualProgress(data.frames);

	const visualProgress = data.frames.map(frame => Math.floor(frame.getProgress()));
	const perceptualProgress = data.frames.map(frame => Math.floor(frame.getPerceptualProgress()));

	t.is(perceptualProgress[0], 0);
	t.is(perceptualProgress[1], 59);
	t.is(perceptualProgress[2], 69);
	t.is(perceptualProgress[3], 100);

	// perceptual progress should respond well to early in-place structure
	t.true(visualProgress[1] < perceptualProgress[1]);
	// perceptual progress should be less influenced by color-only changes
	t.true(visualProgress[2] - visualProgress[1] > perceptualProgress[2] - perceptualProgress[1]);
});

test('speed index calculate the right value', async t => {
	const data = calculateVisualProgressFromImages([
		'./test/assets/Solid_black.jpg',
		'./test/assets/grayscale.jpg'
	]);

	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(indexes.speedIndex, 1000);
});

test('speed indexes calculated for trace w/ 1 frame @ 4242ms', async t => {
	const data = await frame.extractFramesFromTimeline('./test/assets/oneframe-content.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 4242);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 4242);
});

test('speed indexes calculated for 2 frame (blank @1s, content @ 2s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./test/assets/twoframes-blank_content.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 1970);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 2000);
});

test('speed indexes calculated for 2 frame (content @1s, more content @2s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./test/assets/twoframes-content_more.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 1040);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 1030);
});

test('speed indexes calculated for 3 frame (blank @1s, content @2s, more content @3s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./test/assets/threeframes-blank_content_more.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 2040);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 2030);
});

test('speed indexes calculated for realistic trace', async t => {
	const data = await frame.extractFramesFromTimeline('./test/assets/progressive-app-m59.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 542);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 578);
	t.is(Math.floor(data.firstRessource.dns), 55);
	t.is(Math.floor(data.firstRessource.ssl), 80);
	t.is(Math.floor(data.firstRessource.firstByte), 234);
});

test('speed indexes calculated with --fast', t => {
	const mockInitialFrame = fs.readFileSync('./test/assets/frameWhite.jpg');
	const mockTargetFrame = fs.readFileSync('./test/assets/frameC.jpg');
	const mockData = getMockProgressFramesForFast(mockInitialFrame, mockTargetFrame);
	speedIndex.calculateVisualProgress(mockData.frames, {fastMode: true});
	speedIndex.calculatePerceptualProgress(mockData.frames, {fastMode: true});

	const indexes = speedIndex.calculateSpeedIndexes(mockData.frames, mockData.data);
	t.is(Math.floor(indexes.speedIndex), 4360);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 4360);

	// Ensure we skipped computation of most of the 60 fps frames
	const interpolatedFrames = mockData.frames.filter(frame => frame.isProgressInterpolated());
	const interpolatedPerceptualFrames = mockData.frames.filter(frame => frame.isPerceptualProgressInterpolated());
	t.is(interpolatedFrames.length, 107);
	t.is(interpolatedPerceptualFrames.length, 107);
});

test('speed indexes calculated with --fast do not skip large time periods', t => {
	const mockData = {frames: [], data: {startTs: 0}};
	const whiteFrame = fs.readFileSync('./test/assets/frameWhite.jpg');
	const targetFrame = fs.readFileSync('./test/assets/frameC.jpg');
	mockData.frames.push(frame.create(whiteFrame, 10000));
	mockData.frames.push(frame.create(whiteFrame, 20000));
	mockData.frames.push(frame.create(targetFrame, 30000));
	mockData.frames.push(frame.create(whiteFrame, 40000));
	mockData.frames.push(frame.create(targetFrame, 50000));
	speedIndex.calculateVisualProgress(mockData.frames, {fastMode: true});
	speedIndex.calculatePerceptualProgress(mockData.frames, {fastMode: true});

	const indexes = speedIndex.calculateSpeedIndexes(mockData.frames, mockData.data);
	t.is(Math.floor(indexes.speedIndex), 40000);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 40000);
});

test('speed index starts summing from first paint', async t => {
	const mockData = getMockProgessFrames();
	/**
	 *  We've generated frames with this visual progress curve (0, 0, 25, 75, 100)
	 *
	 *      ___________________________________________________
	 *  100 |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████
	 *   75 |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▄▄▄▄▄▄▄▄▄▄██████████
	 *   50 |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████
	 *   25 |░░░░░░░░░░░░░░░░░░░░▄▄▄▄▄▄▄▄▄▄████████████████████
	 *    0 |░░░░░░░░░░░░░░░░░░░░██████████████████████████████
	 *      ----------|----------|---------|---------|---------
	 *      0         1000      2000      3000      4000
	 *
	 *	Speed Index is the area above the curve (goo.gl/0YZ7TP). Second by second:
	 *          1000    +  1000   +   750  +   250   +   0
	 *  Our total sum, and thus our Speed Index, is 3000.
	 */

	const indexes = speedIndex.calculateSpeedIndexes(mockData.frames, mockData.data);
	t.is(Math.floor(indexes.speedIndex), 3000);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 3000);
});

function getMockProgessFrames() {
	// first two frames show no movement
	const f0 = frame.create(null, 0);
	const f1 = frame.create(null, 1000);
	f0.setPerceptualProgress(0);
	f1.setPerceptualProgress(0);
	f0.setProgress(0);
	f1.setProgress(0);
	// f2 at 2s is first paint  (25% vc)
	const f2 = frame.create(null, 2000);
	f2.setPerceptualProgress(25);
	f2.setProgress(25);
	// f3 at 3s fleshes it out (75% vc)
	const f3 = frame.create(null, 3000);
	f3.setPerceptualProgress(75);
	f3.setProgress(75);
	// f4 at 4s completes things (100% vc)
	const f4 = frame.create(null, 4000);
	f4.setPerceptualProgress(100);
	f4.setProgress(100);

	const frames = [f0, f1, f2, f3, f4];
	const data = {startTs: 0};
	return {
		frames,
		data
	};
}

function getMockProgressFramesForFast(initialBuff, targetBuff) {
	const frames = [];

	// first push 60 fps from 0% -> 3%
	for (let i = 0; i < 60; i++) {
		const f = frame.create(initialBuff, 0 + 16 * i);
		f.setProgress(i * 3 / 60);
		f.setPerceptualProgress(i * 3 / 60);
		frames.push(f);
	}

	// then push 60 fps 50% -> 53%
	for (let i = 0; i < 60; i++) {
		const f = frame.create(null, 1000 + 16 * i);
		f.setProgress(50 + i * 3 / 60);
		f.setPerceptualProgress(50 + i * 3 / 60);
		frames.push(f);
	}

	// then push final major frames 60% -> 100%
	for (let i = 6; i <= 10; i++) {
		const f = frame.create(targetBuff, i * 1000);
		f.setProgress(i * 10);
		f.setPerceptualProgress(i * 10);
		frames.push(f);
	}

	const data = {startTs: 0};
	return {frames, data};
}
