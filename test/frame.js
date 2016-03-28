import fs from 'fs';
import test from 'ava';
import frame from '../lib/frame';

const DEFAULT_IMAGE = '';
const DEFAULT_TS = new Date();

function loadImage(imagePath) {
	return new Promise((resolve, reject) => {
		fs.readFile(imagePath, (err, res) => {
			if (err) {
				return reject(err);
			}
			resolve(res);
		});
	});
}

test('getTimeStamp returns the right timestamps', t => {
	const f = frame(DEFAULT_IMAGE, DEFAULT_TS);
	t.same(DEFAULT_TS, f.getTimeStamp());
});

test('getHistogram get the right histogram for black pixel', t => {
	return loadImage('./assets/Solid_black.png')
		.then(image => frame(image, DEFAULT_TS).getHistogram())
		.then(res => {
			for (var i = 0; i < 3; i++) {
				t.true(res[i][0] > 0, 'First entry should have high value');
			}
		});
});

test('getHistogram should not takes in account white pixels', t => {
	return loadImage('./assets/grayscale.png')
		.then(image => frame(image, DEFAULT_TS).getHistogram())
		.then(res => {
			for (var i = 0; i < 3; i++) {
				t.true(res[i][255] === 0, 'White colors should no be present');
			}
		});
});

test('frames can set and retrieve progress', t => {
	const PROGRESS = 43;
	const f = frame(DEFAULT_IMAGE, DEFAULT_TS);

	f.setProgress(PROGRESS);
	t.same(PROGRESS, f.getProgress());
});
