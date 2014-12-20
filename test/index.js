'use strict';

var fs = require('fs');

var _ = require('lodash');
var Hapi = require('hapi');
var Lab = require('lab');
var Code = require('code');
var FormData = require('form-data');
var streamToPromise = require('stream-to-promise');

var lab = exports.lab = Lab.script();

var plugin = require('../');

var internals = {};

internals.defaults = {
    temporary: {
        file: 'test/tmp/file'
    }
};

internals.boostrap = function (config /*, options, fn */) {

    var options = _.isFunction(arguments[2]) ? arguments[1] : {};
    var fn = _.isFunction(arguments[2]) ? arguments[2] : arguments[1];

    var server = new Hapi.Server();
    var props = {
        register: plugin,
        options: options
    };

    server.connection();
    server.register(props, function (err) {

        if (err) {
            return fn(err);
        }

        server.route({
            path: '/',
            method: 'POST',
            config: config
        });

        return fn(null, server);

    });
};

internals.append = function (file, fn) {

    var form = new FormData();
    form.append('file', fs.createReadStream(file));

    var options = {
        url: '/',
        method: 'POST',
        headers: form.getHeaders()
    };

    streamToPromise(form).then(function (payload) {

        options.payload = payload;
        return fn(options);
    });
};


lab.describe('Data parsing-enabled file upload', function () {

    var server, payload;

    lab.before(function (done) {

        payload = {
            output: 'data',
            parse: true
        };

        var handler = function (request, reply) {
            var buffer = request.payload.file;
            var tmp = internals.defaults.temporary.file;

            var done = function (err) {
                if (err) {
                    return reply(err);
                }

                return reply();
            };

            var save = function (err, fd) {
                if (err) {
                    return reply(err);
                }

                fs.write(fd, buffer, 0, buffer.length, 0, done);
            };

            fs.open(tmp, 'w+', save);
        };

        var config = {
            payload: payload,
            handler: handler
        };

        internals.boostrap(config, function (err, instance) {

            if (err) {
                return done(err);
            }

            server = instance;
            return done();
        });
    });

    lab.afterEach(function (done) {

        var file = internals.defaults.temporary.file;
        fs.unlink(file, function () {
            return done();
        });
    });

    lab.test('Returns OK if media type is supported.', function (done) {

        var file = 'test/static/file.png';
        var tmp = internals.defaults.temporary.file;

        var size = function (file, fn) {

            fs.stat(file, function (err, stats) {
                if (err) {
                    return done(err);
                }

                return fn(null, stats.size);
            });
        }

        var verify = function (response) {

            Code.expect(response.statusCode).to.equal(200);

            size(file, function (original) {

                size(tmp, function (copy) {

                    Code.expect(original).to.equal(copy);
                    return done();
                });
            });
        };

        var inject = function (request) {
            server.inject(request, verify);
        };

        internals.append(file, inject);
    });

    lab.test('Returns error if media type is not supported', function (done) {

        var file = 'test/static/file.gif';
        var tmp = internals.defaults.temporary.file;

        var verify = function (response) {

            Code.expect(response.statusCode).to.equal(415);

            fs.stat(tmp, function (err, copy) {
                Code.expect(err).to.not.be.null();

                return done();
            });
        };

        var inject = function (request) {
            server.inject(request, verify);
        };

        internals.append(file, inject);
    });

});
