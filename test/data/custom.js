var fs = require('fs');

var Lab = require('lab');
var Hapi = require('hapi');
var streamToPromise = require('stream-to-promise');
var Form = require('form-data');

var plugin = require('../../lib/index');

Lab.experiment('data output with user-defined file format whitelist', function () {
  var suite = {};

  Lab.before(function (done) {
    suite.request = { url: '/', method: 'POST' };
    suite.server = Hapi.createServer();
    suite.server.pack.register({
      plugin: plugin,
      options: {
        allowed: {
          'gif': '4749'
        }
      }
    }, function (err) {
      suite.server.route({
        path: '/',
        method: 'POST',
        handler: function (request, reply) {
          return reply();
        }
      });

      done();
    });
  });

  Lab.test('returns OK if all files are supported', function (done) {
    var form = new Form();
    form.append('text', 'dummy');
    form.append('file', fs.createReadStream('resources/file.gif'));

    streamToPromise(form).then(function (payload) {
      suite.request.headers = form.getHeaders();
      suite.request.payload = payload;

      suite.server.inject(suite.request, function (response) {
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });
});
