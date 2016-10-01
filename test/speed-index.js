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

test('visual progress should be 100 if there is a single frame only', async t => {
	const data = calculateVisualProgressFromImages(['./assets/grayscale.jpg']);
	t.is(data.frames[0].getProgress(), 100);
});

test('visual progress should be 100 if there is not change', async t => {
	const data = calculateVisualProgressFromImages([
		'./assets/grayscale.jpg',
		'./assets/grayscale.jpg'
	]);

	for (const frame of data.frames) {
		t.is(frame.getProgress(), 100);
	}
});

test('visual progress should have 0 and 100 for different images', async t => {
	const data = calculateVisualProgressFromImages([
		'./assets/Solid_black.jpg',
		'./assets/grayscale.jpg'
	]);

	t.is(data.frames[0].getProgress(), 0);
	t.is(data.frames[1].getProgress(), 100);
});

test('speed index calculate the right value', async t => {
	const data = calculateVisualProgressFromImages([
		'./assets/Solid_black.jpg',
		'./assets/grayscale.jpg'
	]);

	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(indexes.speedIndex, 1000);
	t.is(indexes.perceptualSpeedIndex, 1000);
});

test('speed indexes calculated for trace w/ 1 frame @ 4242ms', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/oneframe-content.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 4242);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 4242);
});

test('speed indexes calculated for 2 frame (blank @1s, content @ 2s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/twoframes-blank_content.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 1980);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 2000);
});

test('speed indexes calculated for 2 frame (content @1s, more content @2s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/twoframes-content_more.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 1040);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 1066);
});

test('speed indexes calculated for 3 frame (blank @1s, content @2s, more content @3s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/threeframes-blank_content_more.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 2040);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 2066);
});

test('speed index starts summing from first paint', async t => {

	const mockData = getMockProgessFrames();
	/**
	 *  We've generated frames with this visual progress curve (0, 0, 25, 75, 100)
	 *
	 *      ___________________________________________________
	 *  100 |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████
	 *   75 |░░░░░░░░░░░░░░░░░░░░░░░░▄▄▄▄▄▄▄████████
	 *   50 |░░░░░░░░░░░░░░░░░░░░░░░░███████████████
	 *   25 |░░░░░░░░░░░░░░░░▄▄▄▄▄▄▄▄███████████████
	 *    0 |░░░░░░░░░░░░░░░░███████████████████████
	 *      ----------|----------|---------|---------|---------
	 *      0         1000      2000      3000      4000
	 *
	 *	Speed Index is the area above the curve. Second by second:
	 *         1000    +  1000   +   750  +   250   +    0
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
	const data = { startTs: 0 };
	return {
		frames,
		data
	}
}
