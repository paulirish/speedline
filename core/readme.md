# speedline-core

This is the core module for speedline, without any CLI dependencies. See [speedline](https://github.com/paulirish/speedline) for the CLI.

### Install

```bash
$ npm install speedline
```

### Usage

```js
const speedline = require('speedline-core');

speedline('./timeline').then(results => {
  console.log('Speed Index value:', results.speedIndex);
});
```

### API

#### `speedline(timeline [, opts])`

* (string | object[]) `timeline`
* (object) `opts`

Returns a (Promise) resolving with an object containing:
  * `beginning` (number) - Recording start timestamp
  * `end` (number) - Recording end timestamp
  * `speedIndex` (number) - speed index value.
  * `perceptualSpeedIndex` (number) - perceptual speed index value.
  * `first` (number) - duration before the first visual change in ms.
  * `complete` (number) - duration before the last visual change in ms.
  * `duration` (number) - timeline recording duration in ms.
  * `frames` ([Frame](#frame)[]) - array of all the frames extracted from the timeline.

**`timeline` parameter**:
* `string` - the parameter represents the location of the of file containing the timeline.
* `array` - the parameter represents the traceEvents content of the timeline file.

**`opts` parameter**:
* `timeOrigin`: Provides the baseline timeStamp, typically navigationStart. Must be a monotonic clock timestamp that matches the trace.  E.g. `speedline('trace.json', {timeOrigin: 103205446186})`
* `fastMode`: If the elapsed time and difference in similarity between two screenshots are small, fastMode will skip decoding and evaluating the frames between them.
* `include`: Specifies which speed indexes to compute, can be one of `all|speedIndex|perceptualSpeedIndex`, defaults to `all`.

#### `Frame`

Object representing a single screenshot.

* `frame.getHistogram()`: (number[][]) - returns the frame histogram. Note that light pixels informations are removed from the histogram, for better speed index calculation accuracy.
* `frame.getTimeStamp()`: (number) - return the frame timestamp.
* `frame.getImage()`: (Buffer) - return the frame content.
* `frame.getProgress()`: (number) - return the frame visual progress.
* `frame.getPerceptualProgress()`: (number) - return the frame perceptual visual progress.


## License

MIT © [Pierre-Marie Dartus](https://github.com/pmdartus)
