#!/usr/bin/env node
'use strict';

var path = require('path');
var meow = require('meow');
var babar = require('babar');
var loudRejection = require('loud-rejection');

var speedIndex = require('./src');

function displayResults(res) {
	console.log(`Speed Index: ${res.speedIndex}`);

	const baseTs = res.frames[0].getTimeStamp();
	const progress = res.frames.map(frame => [frame.getTimeStamp() - baseTs, frame.getProgress()]);
	console.log(babar(progress));
}

function handleError(err) {
	console.error(err.message);
	console.log(Object.keys(err));
	if (err.satck) {
		console.log(err.stack);
	}

	process.exit(1);
}

loudRejection();

var cli = meow([
	'Usage',
	'  $ speed-index <timeline>',
	'',
	'Examples',
	'  $ speed-index ./timeline.json'
]);

if (cli.input.length !== 1) {
	const err = new Error('You should specify a file path!');
	handleError(err);
}

var filePath = path.resolve(process.cwd(), cli.input[0]);

speedIndex(filePath)
	.then(displayResults);
	// .catch(handleError);
