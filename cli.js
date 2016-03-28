#!/usr/bin/env node
'use strict';

var path = require('path');
var meow = require('meow');
var loudRejection = require('loud-rejection');

var speedIndex = require('./lib');

loudRejection();

var cli = meow([
	'Usage',
	'  $ speed-index <timeline>',
	'',
	'Examples',
	'  $ speed-index ./timeline.json'
]);

if (cli.input.length !== 1) {
	console.error('You should specify a file path!');
	process.exit(1);
}

var filePath = path.resolve(process.cwd(), cli.input[0]);

speedIndex(filePath)
	.then(console.log)
	.then(console.error);
