'use strict';

var fs = require('fs');

var streamToPromise = require('stream-to-promise');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var common = require('../common');

lab.describe('Temporary file parsing upload', function () {

    var server, payload;

    lab.before(function (done) {

        payload = {
            output: 'file',
            parse: true
        };

        var handler = function (request, reply) {

            var file = request.payload.file.path;
            var tmp = 'test/tmp/file';

            var input = fs.createReadStream(file);

            var done = function (err) {

                if (err) {
                    return reply(err);
                }

                return reply();
            };

            var copy = function (data) {
                fs.writeFile(tmp, data, { flag: 'w+' }, done);
            };

            streamToPromise(input).then(copy);
        };

        var config = {
            payload: payload,
            handler: handler
        };

        common.boostrap(config, function (err, instance) {

            if (err) {
                return done(err);
            }

            server = instance;
            return done();
        });
    });

    lab.afterEach(function (done) {

        fs.unlink('test/tmp/file', function () {
            return done();
        });
    });

    lab.test('Returns OK if media type is supported.', function (done) {
        common.positive(server, 'test/static/file.png', done);
    });

    lab.test('Returns error if media type is not supported', function (done) {
        common.negative(server, 'test/static/file.gif', done);
    });

});
