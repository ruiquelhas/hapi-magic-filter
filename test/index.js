var fs = require('fs');

var Lab = require('lab');
var Hapi = require('hapi');
var FormData = require('form-data');

var plugin = require('../lib/index');

Lab.experiment('multipart/form-data file upload', function () {
  Lab.before(function (done) {
    var self = this;

    self.aux = {};

    self.aux.server = Hapi.createServer(1337);

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

  Lab.experiment('the files are parsed as data buffers', function () {
    Lab.before(function (done) {
      this.aux.server.route({
        path: '/data',
        method: 'POST',
        config: {
          handler: function (request, reply) {
            reply(request.response);
          },
          payload: {
            output: 'data'
          }
        }
      });

      done();
    });

    Lab.test('returns an OK response if the file type is valid', function (done) {
      var form = new FormData();
      form.append('file', fs.createReadStream('resources/file.png'));
      form.submit('http://127.0.0.1:1337/data', function (err, res) {
        Lab.expect(err).to.be.null;
        Lab.expect(res.statusCode).to.equal(200);
        done();
      });
    });

    Lab.test('returns a unsupported media type error if the file type is invalid', function (done) {
      var form = new FormData();
      form.append('file', fs.createReadStream('resources/file.invalid'));
      form.submit('http://127.0.0.1:1337/data', function (err, res) {
        Lab.expect(err).to.be.null;
        Lab.expect(res.statusCode).to.equal(415);
        done();
      });
    });
  });

  Lab.experiment('the files are parsed as streams', function () {
    Lab.before(function (done) {
      this.aux.server.route({
        path: '/stream',
        method: 'POST',
        config: {
          handler: function (request, reply) {
            reply(request.response);
          },
          payload: {
            output: 'stream'
          }
        }
      });

      done();
    });

    Lab.test('returns an OK response if the file type is valid', function (done) {
      var form = new FormData();
      form.append('file', fs.createReadStream('resources/file.png'));
      form.submit('http://127.0.0.1:1337/stream', function (err, res) {
        Lab.expect(err).to.be.null;
        Lab.expect(res.statusCode).to.equal(200);
        done();
      });
    });

    Lab.test('returns a unsupported media type error if the file type is invalid', function (done) {
      var form = new FormData();
      form.append('file', fs.createReadStream('resources/file.invalid'));
      form.submit('http://127.0.0.1:1337/stream', function (err, res) {
        Lab.expect(err).to.be.null;
        Lab.expect(res.statusCode).to.equal(415);
        done();
      });
    });
  });

  // Lab.experiment('the files are parsed as temporary files', function () {
  //   Lab.before(function (done) {
  //     this.aux.server.route({
  //       path: '/file',
  //       method: 'POST',
  //       config: {
  //         handler: function (request, reply) {
  //           reply(request.response);
  //         },
  //         payload: {
  //           output: 'file'
  //         }
  //       }
  //     });
  //
  //     done();
  //   });
  //
  //   Lab.test('returns an OK response if the file type is valid', function (done) {
  //     var form = new FormData();
  //     form.append('file', fs.createReadStream('resources/file.png'));
  //     form.submit('http://127.0.0.1:1337/file', function (err, res) {
  //       Lab.expect(err).to.be.null;
  //       Lab.expect(res.statusCode).to.equal(200);
  //       done();
  //     });
  //   });
  //
  //   Lab.test('returns a unsupported media type error if the file type is invalid', function (done) {
  //     var form = new FormData();
  //     form.append('file', fs.createReadStream('resources/file.invalid'));
  //     form.submit('http://127.0.0.1:1337/file', function (err, res) {
  //       Lab.expect(err).to.be.null;
  //       Lab.expect(res.statusCode).to.equal(415);
  //       done();
  //     });
  //   });
  // });

  Lab.after(function (done) {
    var self = this;
    self.aux.server.stop(function () {
      delete self.aux;
      done();
    });
  });
});
