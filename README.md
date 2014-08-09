# hapi-magic-filter

Hapi.js plugin to validate multipart/form-data file contents.


## How to use

As usual, you will need to install the package first.

```bash
$ npm install hapi-magic-filter
```

Since this is an [hapi.js](http://hapijs.com/) plugin, you need to use it like so. There are just three things you have need to remember. If you want to use the default file format [whitelist](#whitelist), just register the plugin.

```javascript
var Hapi = require('hapi');
var magic = require('hapi-magic-filter');

var server = Hapi.createServer(1337);
server.pack.register([
  magic,
  // Any other plugins you want to register
], function (err) {
  server.start(function () {
    // whatevs
  });
});
```

If you feel safer using only a subset of the formats available in the default whitelist, you can just provide the list file extensions you are ok with. Let's assume you are just interested in `PNG` or `JPEG` files. You'll need to register the plugin with additional options, providing that information via an array on the `allowed` field.

```javascript
var Hapi = require('hapi');
var magic = require('hapi-magic-filter');

var server = Hapi.createServer(1337);
server.pack.register([
  {
    plugin: magic,
    options: {
      allowed: ['png', 'jpg']
    }
  }
  // Any other plugins you want to register
  ], function (err) {
  server.start(function () {
    // whatevs
  });
});
```

If you are felling hipster, you can just provide your <a name="hipster">own</a> custom whitelist (which will override the default one), using an object whose keys match the file extensions and values match the magic numbers.

```javascript
var Hapi = require('hapi');
var magic = require('hapi-magic-filter');

var server = Hapi.createServer(1337);
server.pack.register([
  {
    plugin: magic,
    options: {
      allowed: {
        'png': '8950',
        'jpg': 'ffd8'
      }
    }
  }
  // Any other plugins you want to register
  ], function (err) {
  server.start(function () {
    // whatevs
  });
});
```

In any case, this is just glue on the `onPreHandler` extension point, so if all the uploaded file types are whitelisted, the plugin will just return control to your application, otherwise it will reply with a proper `HTTP 415 Unsupported Media Type` error.

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
