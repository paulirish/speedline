# speedline [![Build Status](https://travis-ci.org/pmdartus/speedline.svg?branch=master)](https://travis-ci.org/pmdartus/speedline)

![speedline screenshot](/screenshot.png?raw=true)

## Background

The [Navigation Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API) provides useful data that can be used to measure the performance of a website. Unfortunately this API has never been good at capturing the actual *user experience*.

The [Speed Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index), introduced by [WebpageTest.org](http://www.webpagetest.org/), aims to solve this issue. It measures **how fast the page content is visually displayed**. The current implementation is based on the **Visual Progress from Video Capture** calculation method described on the [Speed Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index) page. The visual progress is calculated by comparing the distance between the histogram of the current frame and the final frame.

## Install
Before using `speedline`, please install [ImageMagick](http://www.imagemagick.org/script/index.php) and ensure that your version of node is greater than `5.0`.

```bash
$ npm install -g speedline
```

## CLI

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

## License

MIT © [Pierre-Marie Dartus](https://github.com/pmdartus)
