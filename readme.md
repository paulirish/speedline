# speedline [![Build Status](https://travis-ci.org/paulirish/speedline.svg?branch=master)](https://travis-ci.org/paulirish/speedline) [![NPM speedline package](https://img.shields.io/npm/v/speedline.svg)](https://npmjs.org/package/speedline)


![speedline screenshot](/screenshot.png?raw=true)

## Background

The [Navigation Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API) provides useful data that can be used to measure the performance of a website. Unfortunately this API has never been good at capturing the actual *user experience*.

The [Speed Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index), introduced by [WebpageTest.org](http://www.webpagetest.org/), aims to solve this issue. It measures **how fast the page content is visually displayed**. The current implementation is based on the **Visual Progress from Video Capture** calculation method described on the [Speed Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index) page. The visual progress is calculated by comparing the distance between the histogram of the current frame and the final frame.

Speedline also calculates the **perceptual speed index**, based on the same principal as the original speed index, but it computes the visual progression between frames using the [SSIM](https://en.wikipedia.org/wiki/Structural_similarity) instead of the histogram distance.

## Install the CLI

```bash
$ npm install -g speedline
```

## Usage

> **Note:** You should enable the `screenshot` options before recording the timeline.

```bash
$ speedline --help

  Usage
    $ speedline <timeline> [options]

  Options
    --pretty  Pretty print the output
    --fast    Skip parsing frames between similar ones
                Disclaimer: may result in different metrics due to skipped frames

  Examples
    $ speedline ./timeline.json
```

By default the CLI will output the same output as [visual metrics](https://github.com/WPO-Foundation/visualmetrics). You can use the `--pretty` option if you want to have the histogram.

## The `speedline-core` module

See [readme of `speedline-core`](https://github.com/paulirish/speedline/blob/master/core/readme.md).

## License

MIT © [Pierre-Marie Dartus](https://github.com/pmdartus)

## Dev

The repo is split into CLI and core. The core dependencies are duplicated in both package.json files. It is what it is.

To install: 
```sh
yarn && yarn install-all
````

#### Releasing

Releasing both CLI and core:

```sh
yarn version # and bump appropriately
# update the version in core/package.json
git commit --amend --all # to amend into the tagged commit
npm publish
cd core && npm publish
git push
```
