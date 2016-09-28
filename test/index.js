import path from 'path';
import test from 'ava';
import speedline from '../';

const TIMELINE_PATH = path.join(__dirname, 'assets/progressive-app.json');

test('speedline return object should contain timming informations', async t => {
	const results = await speedline(TIMELINE_PATH);
	t.is(typeof results.first, 'number');
	t.is(typeof results.complete, 'number');
	t.is(typeof results.duration, 'number');
});

test('speedline return object should contain speed index', async t => {
	const results = await speedline(TIMELINE_PATH);
	t.is(typeof results.speedIndex, 'number');
});

test('speedline return object should contain frames informations', async t => {
	const results = await speedline(TIMELINE_PATH);
	t.true(Array.isArray(results.frames));
});

