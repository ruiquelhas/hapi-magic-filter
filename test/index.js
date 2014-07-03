var Request = require('request');

var Lab = require('lab');
var Hapi = require('hapi');
var FormData = require('form-data');

var plugin = require('../lib/index');

Lab.experiment('multipart/form-data file upload', function () {
  Lab.before(function (done) {
    var self = this;

    self.aux = {};

    self.aux.server = Hapi.createServer(1337);
    self.aux.server.route({
      path: '/',
      method: 'POST',
      handler: function (request, reply) {
        reply(request.response);
      }
    });

    self.aux.server.pack.register({
      plugin: plugin,
      options: {
        supported: ['jpg', 'png']
      }
    }, function (err) {
      if (err) {
        throw err;
      }

      self.aux.server.start(done);
    });
  });

  Lab.test('returns an OK response if the file type is valid', function (done) {
    var url = 'http://nodejs.org/images/logo.png';
    var form = new FormData();

    form.append('file', Request.get(url));
    form.submit('http://127.0.0.1:1337/', function (err, res) {
      Lab.expect(err).to.be.null;
      Lab.expect(res.statusCode).to.equal(200);
      done();
    });
  });

  Lab.test('returns a unsupported media type error if the file type is invalid', function (done) {
    var url = 'http://nodejs.org/images/logo.svg';
    var form = new FormData();

    form.append('file', Request.get(url));
    form.submit('http://127.0.0.1:1337/', function (err, res) {
      Lab.expect(err).to.be.null;
      Lab.expect(res.statusCode).to.equal(415);
      done();
    });
  });

  Lab.after(function (done) {
    var self = this;
    self.aux.server.stop(function () {
      delete self.aux;
      done();
    });
  });
});
