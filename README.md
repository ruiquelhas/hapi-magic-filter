# hapi-magic-filter [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url]

Hapi.js plugin to validate multipart/form-data file contents.


## How to use

As usual, you will need to install the package first.

```bash
$ npm install hapi-magic-filter
```

Register the package as a server plugin and provide a proper `options` object as depicted below if you need anything more than the default file format [whitelist](#whitelist).

```javascript
var Hapi = require('hapi');
var magic = require('hapi-magic-filter');

var server = new Hapi.Server();
server.connection({ port: 1337 });

// Allow all file formats from the default whitelist
server.register([
    magic,
    // Any other plugins you want to register
], function (err) {
    server.start(function () {
        // whatevs
    });
});

// Allow only png and jpg files
server.register([{
    register: magic,
    options: {
        allowed: ['png', 'jpg']
    }
}], function (err) {
    server.start(function () {
        // whatevs
    });
});

// Allow custom file formats (ignores default whitelist)
server.register([{
    register: magic,
    options: {
        allowed: {
            'png': '8950',
            'jpg': 'ffd8'
        }
    }
}], function (err) {
    server.start(function () {
        // whatevs
    });
});
```

The plugin acts just as glue on the `onPreHandler` extension point, so if all the uploaded file types are whitelisted, the plugin will just return control to your application, otherwise it will reply with a proper `HTTP 415 Unsupported Media Type` error.

### Default file format <a name="whitelist">whitelist</a>

By default, you get the following whitelist of file formats:

* `bz2`
* `jpg`
* `mp4`
* `ogg`
* `pdf`
* `png`
* `tar`

These are probably the most used interchangeable file formats on the web, but if you think you need more, by now, you should know how to provide your [own](#hipster) whitelist. However, if you think those additional file formats you need, should be an integral part of the base implementation, just open an [issue](//github.com/ruiquelhas/hapi-magic-filter/issues/new) or submit a [pull request](//github.com/ruiquelhas/hapi-magic-filter/compare/).

[coveralls-img]: https://coveralls.io/repos/ruiquelhas/hapi-magic-filter/badge.svg
[coveralls-url]: https://coveralls.io/github/ruiquelhas/hapi-magic-filter
[david-img]: https://david-dm.org/ruiquelhas/hapi-magic-filter.svg
[david-url]: https://david-dm.org/ruiquelhas/hapi-magic-filter
[travis-img]: https://travis-ci.org/ruiquelhas/hapi-magic-filter.svg
[travis-url]: https://travis-ci.org/ruiquelhas/hapi-magic-filter
