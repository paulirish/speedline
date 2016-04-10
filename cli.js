#!/usr/bin/env node
'use strict';

var path = require('path');
var meow = require('meow');
var chalk = require('chalk');
var babar = require('babar');
var loudRejection = require('loud-rejection');

var speedIndex = require('./lib');

function display(res) {
	const startTs = res.frames[0].getTimeStamp();
	const visualProgress = res.frames.map(frame => {
		const ts = Math.floor(frame.getTimeStamp() - startTs);
		return `${ts}=${Math.floor(frame.getProgress())}%`;
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
	console.log(`${chalk.bold('Recording duration')}: ${chalk.green(res.duration + ' ms')}`);
	console.log(`${chalk.bold('First visual change')}: ${chalk.green(res.first + ' ms')}`);
	console.log(`${chalk.bold('Last visual change')}: ${chalk.green(res.complete + ' ms')}`);
	console.log(`${chalk.bold('Speed Index')}: ${chalk.green(res.speedIndex)}`);

	console.log();

	console.log(chalk.bold('Histogram:'));

	var baseTs = res.frames[0].getTimeStamp();
	var progress = res.frames.map(frame => [frame.getTimeStamp() - baseTs, frame.getProgress()]);
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
