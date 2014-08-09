var fs = require('fs');

var Lab = require('lab');
var Hapi = require('hapi');
var Nipple = require('nipple');
var Form = require('form-data');

var internals = {};
internals.handler = function (request, reply) { return reply(); };

var plugin = require('../lib/index');

Lab.experiment('multipart/form-data file upload', function () {
  var suite = {};

  Lab.before(function (done) {
    suite.request = { method: 'POST' };
    suite.server = Hapi.createServer();
    suite.server.pack.register({
      plugin: plugin,
      options: {
        allowed: ['jpg', 'png']
      }
    }, function (err) {
      suite.server.route({
        path: '/data',
        method: 'POST',
        config: {
          payload: { output: 'data' },
          handler: internals.handler
        }
      });

      suite.server.route({
        path: '/stream',
        method: 'POST',
        config: {
          payload: { output: 'stream' },
          handler: internals.handler
        }
      });

      suite.server.route({
        path: '/file',
        method: 'POST',
        config: {
          payload: { output: 'file' },
          handler: internals.handler
        }
      });

      done();
    });
  });

  Lab.experiment('when no file is provided for upload', function () {
    Lab.beforeEach(function (done) {
      suite.form = new Form();
      suite.form.append('text', 'dummy');
      Nipple.read(suite.form, function (err, buffer) {
        suite.request.payload = buffer;
        suite.request.headers = suite.form.getHeaders();
        done();
      });
    });

    Lab.test('everything should work fine', function (done) {
      suite.request.url = '/data';
      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  Lab.experiment('when the file type is supported, the file should be upladed', function () {
    Lab.beforeEach(function (done) {
      suite.form = new Form();
      suite.form.append('file', fs.createReadStream('resources/file.png'));
      Nipple.read(suite.form, function (err, buffer) {
        suite.request.payload = buffer;
        suite.request.headers = suite.form.getHeaders();
        done();
      });
    });

    Lab.test('after it is read fully into memory', function (done) {
      suite.request.url = '/data';
      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });

    Lab.test('if it is streamed by the server', function (done) {
      suite.request.url = '/stream';
      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });

    Lab.test('if it is written to a temporary reference', function (done) {
      suite.request.url = '/file';
      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  Lab.experiment('when the file type is not supported, the server should return an error', function () {
    Lab.beforeEach(function (done) {
      suite.form = new Form();
      suite.form.append('file', fs.createReadStream('resources/file.invalid'));
      Nipple.read(suite.form, function (err, buffer) {
        suite.request.payload = buffer;
        suite.request.headers = suite.form.getHeaders();
        done();
      });
    });

    Lab.test('after it is read fully into memory', function (done) {
      suite.request.url = '/data';
      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(415);
        done();
      });
    });

    Lab.test('if it is streamed by the server', function (done) {
      suite.request.url = '/stream';
      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(415);
        done();
      });
    });

    Lab.test('if it is written to a temporary reference', function (done) {
      suite.request.url = '/file';
      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(415);
        done();
      });
    });
  });
});
