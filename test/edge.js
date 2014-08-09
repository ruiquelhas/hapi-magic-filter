var fs = require('fs');

var Lab = require('lab');
var Hapi = require('hapi');
var streamToPromise = require('stream-to-promise');
var Form = require('form-data');

var plugin = require('../lib/index');

Lab.experiment('file output with user-defined file format whitelist', function () {
  var suite = {};

  Lab.before(function (done) {
    suite.server = Hapi.createServer();
    suite.server.pack.register({
      plugin: plugin,
      options: {
        allowed: {
          'png': '8950'
        }
      }
    }, function (err) {
      suite.server.route({
        path: '/',
        method: ['GET', 'POST'],
        handler: function (request, reply) {
          return reply();
        }
      });

      done();
    });
  });

  Lab.test('returns control to the app if there is nothing to upload', function (done) {
    suite.request = { url: '/', method: 'POST' };
    suite.server.inject(suite.request, function (response) {
      Lab.expect(response.statusCode).to.equal(200);
      done();
    });
  });

  Lab.test('returns control to the app on GET requests', function (done) {
    suite.request = { url: '/', method: 'GET' };
    suite.server.inject(suite.request, function (response) {
      Lab.expect(response.statusCode).to.equal(200);
      done();
    });
  });

  Lab.test('returns error if some file is not supported', function (done) {
    var form = new Form();
    form.append('text', 'dummy');
    form.append('file', fs.createReadStream('resources/file.gif'));

    streamToPromise(form).then(function (payload) {
      suite.request = {
        headers: form.getHeaders(),
        method: 'POST',
        payload: payload,
        url: '/'
      };

      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(415);
        done();
      });
    });
  });
});
