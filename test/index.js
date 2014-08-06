var fs = require('fs');

var Lab = require('lab');
var Hapi = require('hapi');
var FormData = require('form-data');

var plugin = require('../lib/index');

Lab.experiment('multipart/form-data file upload', function () {
  var suite = {};

  Lab.before(function (done) {
    suite.server = Hapi.createServer();
    suite.server.pack.register({
      plugin: plugin,
      options: {
        supported: ['jpg', 'png']
      }
    }, done);
  });

  Lab.experiment('the files are parsed as data buffers', function () {
    Lab.test('returns an OK response if the file type is valid', function (done) {
      done();
    });

    Lab.test('returns a unsupported media type error if the file type is invalid', function (done) {
      done();
    });
  });

  Lab.experiment('the files are parsed as streams', function () {
    Lab.test('returns an OK response if the file type is valid', function (done) {
      done();
    });

    Lab.test('returns a unsupported media type error if the file type is invalid', function (done) {
      done();
    });
  });

  Lab.experiment('the files are parsed as temporary files', function () {
    Lab.test('returns an OK response if the file type is valid', function (done) {
      done();
    });

    Lab.test('returns a unsupported media type error if the file type is invalid', function (done) {
      done();
    });
  });
});
