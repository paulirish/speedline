# speed-index [![Build Status](https://travis-ci.org/pmdartus/speed-index.svg?branch=master)](https://travis-ci.org/pmdartus/speed-index)

> My astonishing module


## Install

```
$ npm install --save speed-index
```


## Usage

```js
const speedIndex = require('speed-index');

speedIndex('unicorns');
//=> 'unicorns & rainbows'
```


## API

### speedIndex(input, [options])

#### input

Type: `string`

Lorem ipsum.

#### options

##### foo

Type: `boolean`<br>
Default: `false`

Lorem ipsum.


## CLI

```
$ npm install --global speed-index
```

```
$ speed-index --help

  Usage
    speed-index [input]

  Options
    --foo  Lorem ipsum. [Default: false]

  Examples
    $ speed-index
    unicorns & rainbows
    $ speed-index ponies
    ponies & rainbows
```


## License

MIT © [Pierre-Marie Dartus](https://github.com/pmdartus)
