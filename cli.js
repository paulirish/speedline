#!/usr/bin/env node
'use strict';

var path = require('path');
var meow = require('meow');
var babar = require('babar');
var loudRejection = require('loud-rejection');

var speedIndex = require('./lib');

const OUTPUT_GREEN = '\x1b[32m';
const OUTPUT_BOLD = '\x1b[1m';
const OUTPUT_RESET = '\x1b[22m\x1b[39m';

function display(res) {
	const startTs = res.start;
	const visualProgress = res.frames.map(frame => {
		const ts = Math.floor(frame.params.timestamp - startTs);
		return `${ts}=${Math.floor(frame.params.encodedDataLength)}%`;
	}).join(', ');

	const log = [
		`First Visual Change: ${res.first}`,
		`Visually Complete: ${res.complete}`,
		`Speed Index: ${res.speedIndex}`,
		`Visual Progress: ${visualProgress}`
	].join(`\n`);
	console.log(log);
}

function displayPretty(res) {
	const green = (content) => OUTPUT_GREEN + content + OUTPUT_RESET;
	const bold = (content) => OUTPUT_BOLD + content + OUTPUT_RESET;

	console.log([

		`${bold('Download throughput:')}`
	].join('\n'));

	var baseTs = res.frames[0].params.timestamp;

	var progress = res.frames.map(frame => {
		// const time = Math.floor((frame.params.timestamp - baseTs) / 1000);
		const time = (frame.params.timestamp - baseTs) * 1000;
		return [Math.floor(time), frame.params.encodedDataLength]
	});
	console.log(babar(progress, {width: 190}));

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
	'  -p, --pretty  Pretty print the output',
	'',
	'Examples',
	'  $ speedline ./timeline.json'
]);

if (cli.input.length !== 1) {
	const err = new Error('You should specify a file path!');
	handleError(err);
}

var filePath = path.resolve(process.cwd(), cli.input[0]);

speedIndex(filePath).then(function (res) {
	if (cli.flags.pretty) {
		return displayPretty(res);
	}

	display(res);
});
