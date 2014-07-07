var fs = require('fs');

var Lab = require('lab');
var Hapi = require('hapi');
var FormData = require('form-data');
var Request = require('request');

var plugin = require('../index');

Lab.experiment('filter form-data media content with magic number validation', function () {
  Lab.beforeEach(function (done) {
    var self = this;
    self.aux = {};

    self.aux.server = Hapi.createServer(1337);

    self.aux.server.route({
      path: '/data',
      method: 'POST',
      config: {
        payload: { output: 'data' },
        handler: function (request, reply) { reply(request.response); }
      }
    });

    self.aux.server.route({
      path: '/stream',
      method: 'POST',
      config: {
        payload: { output: 'stream' },
        handler: function (request, reply) { reply(request.response); }
      }
    });

    self.aux.server.route({
      path: '/file',
      method: 'POST',
      config: {
        payload: { output: 'file' },
        handler: function (request, reply) { reply(request.response); }
      }
    });

    self.aux.server.pack.register({
      plugin: plugin,
      options: {
        supported: ['jpg', 'png', 'gif']
      }
    }, function (err) {
      if (err) {
        throw err;
      }

      self.aux.server.start(done);
    });
  });

  Lab.experiment('the control is returned back to the main application', function () {
    Lab.test('if the Content-Type is not application/form-data', function (done) {
      Request.post('http://127.0.0.1:1337/data', { dummy: 'dummy' }, function (err, response) {
        Lab.expect(err).to.be.null;
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });

    Lab.test('if the request method is not "POST"', function (done) {
      Request.get('http://127.0.0.1:1337/data', function (err, response) {
        Lab.expect(err).to.be.null;
        Lab.expect(response.statusCode).to.equal(404);
        done();
      });
    });
  });

  Lab.experiment('HTTP POST request with a multipart/form-data payload', function () {
    Lab.experiment('the server parses the payload media resources as data buffers', function () {
      Lab.test('returns an OK response if all the upload data is valid', function (done) {
        var form = new FormData();
        form.append('textual', 'regular plain text');
        form.append('file', fs.createReadStream('resources/file.png'));
        form.submit('http://127.0.0.1:1337/data', function (err, response) {
          Lab.expect(err).to.be.null;
          Lab.expect(response.statusCode).to.equal(200);
          done();
        });
      });

      Lab.test('returns an appropriate error if the file type is not allowed', function (done) {
        var form = new FormData();
        form.append('textual', 'regular plain text');
        form.append('file', fs.createReadStream('resources/file.js'));
        form.submit('http://127.0.0.1:1337/data', function (err, response) {
          Lab.expect(err).to.be.null;
          Lab.expect(response.statusCode).to.equal(415);
          done();
        });
      });
    });

    Lab.experiment('the server parses the payload media resources as streams', function () {
      Lab.test('returns an OK response if all the upload data is valid', function (done) {
        var form = new FormData();
        form.append('textual', 'regular plain text');
        form.append('file', fs.createReadStream('resources/file.png'));
        form.submit('http://127.0.0.1:1337/stream', function (err, response) {
          Lab.expect(err).to.be.null;
          Lab.expect(response.statusCode).to.equal(200);
          done();
        });
      });

      Lab.test('returns an appropriate error if the file type is not allowed', function (done) {
        var form = new FormData();
        form.append('textual', 'regular plain text');
        form.append('file', fs.createReadStream('resources/file.js'));
        form.submit('http://127.0.0.1:1337/stream', function (err, response) {
          Lab.expect(err).to.be.null;
          Lab.expect(response.statusCode).to.equal(415);
          done();
        });
      });
    });

    Lab.experiment('the server parses the payload media resources as temporary files', function () {
      Lab.test('returns an OK response if all the upload data is valid', function (done) {
        var form = new FormData();
        form.append('textual', 'regular plain text');
        form.append('file', fs.createReadStream('resources/file.png'));
        form.submit('http://127.0.0.1:1337/file', function (err, response) {
          Lab.expect(err).to.be.null;
          Lab.expect(response.statusCode).to.equal(200);
          done();
        });
      });

      Lab.test('returns an appropriate error if the file type is not allowed', function (done) {
        var form = new FormData();
        form.append('textual', 'regular plain text');
        form.append('file', fs.createReadStream('resources/file.js'));
        form.submit('http://127.0.0.1:1337/file', function (err, response) {
          Lab.expect(err).to.be.null;
          Lab.expect(response.statusCode).to.equal(415);
          done();
        });
      });
    });

  });

  Lab.afterEach(function (done) {
    var self = this;
    self.aux.server.stop(function (err) {
      if (err) {
        throw err;
      }

      delete self.aux;
      done();
    });
  });
});
