import fs from 'fs';
import test from 'ava';
import frame from '../src/frame';

const DEFAULT_IMAGE = fs.readFileSync('./assets/Solid_black.jpg');
const DEFAULT_TS = new Date().getTime();

test('getTimeStamp returns the right timestamps', t => {
	const f = frame.create(DEFAULT_IMAGE, DEFAULT_TS);
	t.is(f.getTimeStamp(), DEFAULT_TS);
});

test('getHistogram get the right histogram for black pixel', async t => {
	const res = await frame.create(DEFAULT_IMAGE, DEFAULT_TS).getHistogram();

	for (const x of res) {
		t.true(x[0] > 0, 'Lowest pixel doesn\'t match with black');
	}
});

test('getHistogram should not takes in account white pixels', async t => {
	const imgBuff = fs.readFileSync('./assets/grayscale.jpg');
	const res = await frame.create(imgBuff, DEFAULT_TS).getHistogram();

	for (const x of res) {
		t.true(x[255] === 0, 'Highest pixel is not white');
	}
});

test('frames can set and retrieve progress', t => {
	const PROGRESS = 43;
	const f = frame.create(DEFAULT_IMAGE, DEFAULT_TS);

	f.setProgress(PROGRESS);
	t.is(f.getProgress(), PROGRESS);
});

test('extract frames from timeline should return a data object with an array of frames', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/nyt.json');
	t.is(data.startTs, 282644630.041, 'data.startTs doesn\'t match expected value');
	t.truthy(data.endTs, 'data.endTs doesn\'t exist');
	t.true(Array.isArray(data.frames), 'Frames is not an array');
});

test('extract frames should support json', async t => {
	const trace = JSON.parse(fs.readFileSync('./assets/progressive-app.json', 'utf-8'));
	const data = await frame.extractFramesFromTimeline(trace);
	t.is(data.startTs, 103204916.772, 'data.startTs doesn\'t match expected value');
	t.true(Array.isArray(data.frames), 'Frames is not an array');
	t.is(data.frames.length, 7, 'Number of frames is incorrect');
});

test('extract frames from timeline supports options', async t => {
	const data = await frame.extractFramesFromTimeline('./assets/progressive-app.json', {timeOrigin: 103206183179});
	t.is(data.startTs, 103206183.179, 'data.startTs doesn\'t match supplied timeOrigin value');
	t.truthy(data.endTs, 'data.endTs doesn\'t exist');
	t.true(Array.isArray(data.frames), 'Frames is not an array');
	t.is(data.frames.length, 4, 'Frames were not filtered');
});
