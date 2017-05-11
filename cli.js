#!/usr/bin/env node
'use strict';

var path = require('path');
var meow = require('meow');
var babar = require('babar');
var loudRejection = require('loud-rejection');

var speedIndex = require('.');

const OUTPUT_GREEN = '\x1b[32m';
const OUTPUT_BOLD = '\x1b[1m';
const OUTPUT_RESET = '\x1b[22m\x1b[39m';

function display(res) {
	const startTs = res.beginning;
	const visualProgress = res.frames.map(frame => {
		const ts = Math.floor(frame.getTimeStamp() - startTs);
		return `${ts}=${Math.floor(frame.getProgress())}%`;
	}).join(', ');

	const visualPreceptualProgress = res.frames.map(frame => {
		const ts = Math.floor(frame.getTimeStamp() - startTs);
		return `${ts}=${Math.floor(frame.getPerceptualProgress())}%`;
	}).join(', ');

	const log = [
		`First Visual Change: ${res.first}`,
		`Visually Complete: ${res.complete}`,
		'',
		`Speed Index: ${res.speedIndex.toFixed(1)}`,
		`Visual Progress: ${visualProgress}`,
		'',
		`Perceptual Speed Index: ${res.perceptualSpeedIndex.toFixed(1)}`,
		`Perceptual Visual Progress: ${visualPreceptualProgress}`
	].join(`\n`);
	console.log(log);
}

function displayPretty(res) {
	const green = (content) => OUTPUT_GREEN + content + OUTPUT_RESET;
	const bold = (content) => OUTPUT_BOLD + content + OUTPUT_RESET;

	console.log([
		`${bold('Recording duration')}: ${green(res.duration + ' ms')}  (${res.frames.length} frames found)`,
		`${bold('First visual change')}: ${green(res.first + ' ms')}`,
		`${bold('Last visual change')}: ${green(res.complete + ' ms')}`,
		`${bold('Speed Index')}: ${green(res.speedIndex.toFixed(1))}`,
		`${bold('Perceptual Speed Index')}: ${green(res.perceptualSpeedIndex.toFixed(1))}`,
		'',
		`${bold('Histogram visual progress:')}`
	].join('\n'));

	var baseTs = res.frames[0].getTimeStamp();

	var progress = res.frames.map(frame => [frame.getTimeStamp() - baseTs, frame.getProgress()]);
	console.log(babar(progress));

	console.log(bold('Histogram perceptual visual progress:'));
	var perceptualProgress = res.frames.map(frame => [frame.getTimeStamp() - baseTs, frame.getPerceptualProgress()]);
	console.log(babar(perceptualProgress));
}

function handleError(err) {
	console.error(err.message);
	console.log(Object.keys(err));
	if (err.stack) {
		console.log(err.stack);
	}

	process.exit(1);
}

loudRejection();

var cli = meow([
	'Usage',
	'  $ speedline <timeline>',
	'',
	'Options',
	'  --pretty  Pretty print the output',
	'  --fast    Skip parsing frames between similar ones',
	'              Disclaimer: may result in different metrics due to skipped frames',
	'',
	'Examples',
	'  $ speedline ./timeline.json'
]);

if (cli.input.length !== 1) {
	const err = new Error('You should specify a file path!');
	handleError(err);
}

var filePath = path.resolve(process.cwd(), cli.input[0]);

if (cli.flags.fast) {
	console.warn('WARNING: using --fast may result in different metrics due to skipped frames');
}

speedIndex(filePath, {fastMode: cli.flags.fast}).then(function (res) {
	if (cli.flags.pretty) {
		return displayPretty(res);
	}

	display(res);
}).catch(err => {
	handleError(err);
 });
