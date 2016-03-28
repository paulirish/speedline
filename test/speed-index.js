import test from 'ava';
import fs from 'fs-promise';
import Promise from 'bluebird';

import frame from '../lib/frame';
import speedIndex from '../lib/speed-index';

function calculateVisualProgressFromImages(images = [], delay = 1000) {
	const baseTs = new Date();

	return Promise.map(images, imgPath => fs.readFile(imgPath))
		.map((img, i) => frame.create(img, baseTs + i * delay))
		.tap(speedIndex.calculateVisualProgress);
}

test('visual progress should be 100 if there is a single frame only', t => {
	return calculateVisualProgressFromImages([
		'./assets/grayscale.png'
	]).then(frames => {
		t.same(frames[0].getProgress(), 100);
	});
});

test('visual progress should be 100 if there is not change', t => {
	return calculateVisualProgressFromImages([
		'./assets/grayscale.png',
		'./assets/grayscale.png'
	]).then(frames => {
		for (var i = 0; i < frames.length; i++) {
			t.same(frames[i].getProgress(), 100);
		}
	});
});

test('visual progress should have 0 and 100 for different images', t => {
	return calculateVisualProgressFromImages([
		'./assets/Solid_black.png',
		'./assets/grayscale.png'
	]).then(frames => {
		t.same(frames[0].getProgress(), 0);
		t.same(frames[1].getProgress(), 100);
	});
});
