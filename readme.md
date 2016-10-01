# speedline [![Build Status](https://travis-ci.org/pmdartus/speedline.svg?branch=master)](https://travis-ci.org/pmdartus/speedline) [![NPM speedline package](https://img.shields.io/npm/v/speedline.svg)](https://npmjs.org/package/speedline)


![speedline screenshot](/screenshot.png?raw=true)

## Background

The [Navigation Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API) provides useful data that can be used to measure the performance of a website. Unfortunately this API has never been good at capturing the actual *user experience*.

The [Speed Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index), introduced by [WebpageTest.org](http://www.webpagetest.org/), aims to solve this issue. It measures **how fast the page content is visually displayed**. The current implementation is based on the **Visual Progress from Video Capture** calculation method described on the [Speed Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index) page. The visual progress is calculated by comparing the distance between the histogram of the current frame and the final frame.

Speedline also calculates the **perceptual speed index**, based on the same principal as the original speed index, but it computes the visual progression between frames using the [SSIM](https://en.wikipedia.org/wiki/Structural_similarity) instead of the histogram distance.

## CLI

### Install

```bash
$ npm install -g speedline
```

### Usage

> **Note:** You should enable the `screenshot` options before recording the timeline.

```bash
$ speedline --help

  Usage
    $ speedline <timeline> [options]

  Options
    -p, --pretty  Pretty print the output

  Examples
    $ speedline ./timeline.json
```

By default the CLI will output the same output as [visual metrics](https://github.com/WPO-Foundation/visualmetrics). You can use the `--pretty` option if you want to have the histogram.

## Module

### Install

```bash
$ npm install --save speedline
```

### Usage

```js
const speedline = require('speedline');

speedline('./timeline').then(results => {
  console.log('Speed Index value:', results.speedIndex);
});
```

### API

#### `speedline(timeline)`

* (string | object[]) `timeline`
* returns (Promise) resolving with an object containing:
  * `beginning` (number) - Recording start timestamp    
  * `end` (number) - Recording end timestamp
  * `speedIndex` (number) - speed index value.
  * `perceptualSpeedIndex` (number) - perceptual speed index value.
  * `first` (number) - duration before the first visual change in ms.
  * `complete` (number) - duration before the last visual change in ms.
  * `duration` (number) - timeline recording duration in ms.
  * `frames` ([Frame](#frame)[]) - array of all the frames extracted from the timeline.

If the type of the timeline parameter is:
* `string` - the parameter represents the location of the of file containing the timeline.
* `array` - the parameter represents the traceEvents content of the timeline file.

#### `Frame`

Object representing a single screenshot.

* `frame.getHistogram()`: (number[][]) - returns the frame histogram. Note that light pixels informations are removed from the histogram, for better speed index calculation accuracy.
* `frame.getTimeStamp()`: (number) - return the frame timestamp.
* `frame.getImage()`: (Buffer) - return the frame content.
* `frame.getProgress()`: (number) - return the frame visual progress.
* `frame.getPerceptualProgress()`: (number) - return the frame perceptual visual progress.


## License

MIT © [Pierre-Marie Dartus](https://github.com/pmdartus)
