import test from 'ava';
import fs from 'fs-promise';

import frame from '../lib/frame';

const DEFAULT_IMAGE = '';
const DEFAULT_TS = new Date().getTime();

test('getTimeStamp returns the right timestamps', t => {
	const f = frame.create(DEFAULT_IMAGE, DEFAULT_TS);
	t.same(DEFAULT_TS, f.getTimeStamp());
});

test('getHistogram get the right histogram for black pixel', t => {
	return fs.readFile('./assets/Solid_black.png')
		.then(image => frame.create(image, DEFAULT_TS).getHistogram())
		.then(res => {
			for (var i = 0; i < 3; i++) {
				t.true(res[i][0] > 0, 'Lowest pixel doesn\'t match with black');
			}
		});
});

test('getHistogram should not takes in account white pixels', t => {
	return fs.readFile('./assets/grayscale.png')
		.then(image => frame.create(image, DEFAULT_TS).getHistogram())
		.then(res => {
			for (var i = 0; i < 3; i++) {
				t.true(res[i][255] === 0, 'Highest pixel is not white');
			}
		});
});

test('frames can set and retrieve progress', t => {
	const PROGRESS = 43;
	const f = frame.create(DEFAULT_IMAGE, DEFAULT_TS);

	f.setProgress(PROGRESS);
	t.same(PROGRESS, f.getProgress());
});

test.skip('extract frames from timeline should returns an array of frames', t => {
	return frame.extractFramesFromTimeline('./assets/nyt.json')
		.then(frames => {
			t.ok(Array.isArray(frames), 'Frames is not an array');
		});
});
