import fs from 'fs';
import test from 'ava';

import frame from '../lib/frame';
import speedIndex from '../lib/speed-index';

function calculateVisualProgressFromImages(images = [], delay = 1000) {
	const baseTs = new Date().getTime();

	const frames = images.map((imgPath, i) => {
		const imgBuff = fs.readFileSync(imgPath);
		return frame.create(imgBuff, baseTs + i * delay);
	});

	return speedIndex.calculateVisualProgress(frames);
}

test('visual progress should be 100 if there is a single frame only', async t => {
	const frames = calculateVisualProgressFromImages(['./assets/grayscale.jpg']);
	t.is(frames[0].getProgress(), 100);
});

test('visual progress should be 100 if there is not change', async t => {
	const frames = calculateVisualProgressFromImages([
		'./assets/grayscale.jpg',
		'./assets/grayscale.jpg'
	]);

	for (const frame of frames) {
		t.is(frame.getProgress(), 100);
	}
});

test('visual progress should have 0 and 100 for different images', async t => {
	const frames = calculateVisualProgressFromImages([
		'./assets/Solid_black.jpg',
		'./assets/grayscale.jpg'
	]);

	t.is(frames[0].getProgress(), 0);
	t.is(frames[1].getProgress(), 100);
});

test('speed index calculate teh right value', async t => {
	const frames = calculateVisualProgressFromImages([
		'./assets/Solid_black.jpg',
		'./assets/grayscale.jpg'
	]);

	t.is(speedIndex.calculateSpeedIndex(frames), 1000);
});
