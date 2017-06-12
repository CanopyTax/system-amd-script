# system-amd-script
SystemJS plugin for script loading AMD modules

[![npm version](https://img.shields.io/npm/v/system-amd-script.svg?style=flat-square)](https://www.npmjs.org/package/system-amd-script)
[![Build Status](https://img.shields.io/travis/CanopyTax/system-amd-script.svg?style=flat-square)](https://travis-ci.org/CanopyTax/system-amd-script)
[![Code Coverage](https://img.shields.io/codecov/c/github/CanopyTax/system-amd-script.svg?style=flat-square)](https://codecov.io/github/CanopyTax/system-amd-script)

### Motivation:
By default SystemJS requests resources by making an XHR request and
evaling the code. This is done to allow transpiling the source at runtime
in the browser before it gets evaled. The problem is evaling the code
isn't necessarily performant. Also, it can screw up stack traces
recorded by error services (sentry, trackjs, etc). System-amd-script
uses script tags to load the modules instead.

### Installation:
Loaded modules *must* be named AMD modules where the name in the define statement is the same as the name that is being imported. It is recommended to use a locate plugin for AMD resources. [Sofe](https://github.com/CanopyTax/sofe) works well for this.

```js
jspm install npm:system-canopy-script
```

### Usage:

```js
// Module helper.js
define('helper', [], _ => {
	return _ => 'Some value!';
});

// Entry app.js
import getValue from 'helper!system-canopy-script';

getValue() === 'Some value!';
```
