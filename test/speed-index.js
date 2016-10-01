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
	t.is(indexes.speedIndex, 2000);
	t.is(indexes.perceptualSpeedIndex, 2000);
});

test('speed indexes calculated for trace w/ 1 frame @ 4242ms', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/oneframe-content.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 629);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 629);
});

test('speed indexes calculated for 2 frame (blank @1s, content @ 2s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/twoframes-blank_content.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 2986);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 3032);
});

test('speed indexes calculated for 2 frame (content @1s, more content @2s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/twoframes-content_more.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 1680);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 1738);
});

test('speed indexes calculated for 3 frame (blank @1s, content @2s, more content @3s) trace', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/threeframes-blank_content_more.json');
	speedIndex.calculateVisualProgress(data.frames);
	speedIndex.calculatePerceptualProgress(data.frames);
	const indexes = speedIndex.calculateSpeedIndexes(data.frames, data);
	t.is(Math.floor(indexes.speedIndex), 1680);
	t.is(Math.floor(indexes.perceptualSpeedIndex), 1738);
});

