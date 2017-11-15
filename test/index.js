import path from 'path';
import test from 'ava';
import speedline from '../';

const TIMELINE_PATH = path.join(__dirname, 'assets/progressive-app.json');

test('speedline return object should contain timing informations', async t => {
	const results = await speedline(TIMELINE_PATH);
	t.is(typeof results.first, 'number');
	t.is(typeof results.complete, 'number');
	t.is(typeof results.duration, 'number');
});

test('speedline return object should contain speed index', async t => {
	const results = await speedline(TIMELINE_PATH);
	t.is(typeof results.speedIndex, 'number');
	t.is(Math.floor(results.speedIndex), 1134);
	t.is(Math.floor(results.perceptualSpeedIndex), 1156);
});

test('speedline return object should only compute what is asked', async t => {
	const results = await speedline(TIMELINE_PATH, {include: 'perceptualSpeedIndex'});
	t.is(typeof results.speedIndex, 'undefined');
	t.is(Math.floor(results.perceptualSpeedIndex), 1156);
});

test('speedline can takes timeOrigin option and adjusts results', async t => {
	const results = await speedline(TIMELINE_PATH, {timeOrigin: 103205446186});
	t.is(typeof results.speedIndex, 'number');
	t.is(Math.floor(results.speedIndex), 604);
});

test('speedline return object should contain frames informations', async t => {
	const results = await speedline(TIMELINE_PATH);
	t.true(Array.isArray(results.frames));
});

