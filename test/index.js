var fs = require('fs');

var Lab = require('lab');
var Hapi = require('hapi');
var FormData = require('form-data');

var plugin = require('../index');

Lab.experiment('HTTP POST request with a multipart/form-data payload', function () {
  Lab.before(function (done) {
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
        supported: ['jpg', 'png']
      }
    }, function (err) {
      if (err) {
        throw err;
      }
      self.aux.server.start(done);
    });
  });

  Lab.experiment('the server parses the payload media resources as data buffers', function () {
    Lab.test('returns an OK response if all the upload data is valid', function (done) {
      var form = new FormData();
      form.append('file', fs.createReadStream('resources/file.png'));
      form.submit('http://127.0.0.1:1337/data', function (err, response) {
        Lab.expect(err).to.be.null;
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });

    Lab.test('returns an appropriate error if the file type is not supported', function (done) {
      var form = new FormData();
      form.append('file', fs.createReadStream('resources/file.invalid'));
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
      form.append('file', fs.createReadStream('resources/file.png'));
      form.submit('http://127.0.0.1:1337/stream', function (err, response) {
        Lab.expect(err).to.be.null;
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });

    Lab.test('returns an appropriate error if the file type is not supported', function (done) {
      var form = new FormData();
      form.append('file', fs.createReadStream('resources/file.invalid'));
      form.submit('http://127.0.0.1:1337/stream', function (err, response) {
        Lab.expect(err).to.be.null;
        Lab.expect(response.statusCode).to.equal(415);
        done();
      });
    });
  });

  // Lab.experiment('the server parses the payload media resources as temporary files', function () {
  //   Lab.test('returns an OK response if all the upload data is valid', function (done) {
  //     var form = new FormData();
  //     form.append('file', fs.createReadStream('resources/file.png'));
  //     form.submit('http://127.0.0.1:1337/file', function (err, response) {
  //       Lab.expect(err).to.be.null;
  //       Lab.expect(response.statusCode).to.equal(200);
  //       done();
  //     });
  //   });
  //
  //   Lab.test('returns an appropriate error if the file type is not supported', function (done) {
  //     var form = new FormData();
  //     form.append('file', fs.createReadStream('resources/file.invalid'));
  //     form.submit('http://127.0.0.1:1337/file', function (err, response) {
  //       Lab.expect(err).to.be.null;
  //       Lab.expect(response.statusCode).to.equal(415);
  //       done();
  //     });
  //   });
  // });

  Lab.after(function (done) {
    var self = this;
    self.aux.server.stop(function (err) {
      if (err) {
        throw err;
      }

      delete self.aux;
      done();
    })
  });
});
