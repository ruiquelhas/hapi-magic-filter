'use strict';

var fs = require('fs');

var _ = require('lodash');
var Hapi = require('hapi');
var Code = require('code');

var FormData = require('form-data');
var streamToPromise = require('stream-to-promise');

var plugin = require('../');

var internals = {};

internals.append = function (file, fn) {

    var form = new FormData();
    form.append('text', 'Hello');
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


exports = module.exports = {};

exports.boostrap = function (config /*, options, fn */) {

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

exports.positive = function (server, file, done) {
    var tmp = 'test/tmp/file';

    var size = function (file, fn) {

        fs.stat(file, function (err, stats) {

            if (err) {
                return done(err);
            }

            return fn(null, stats.size);
        });
    };

    var verify = function (response) {

        Code.expect(response.statusCode).to.equal(200);

        size(file, function (err, original) {

            size(tmp, function (err, copy) {

                Code.expect(err).to.not.exist();
                Code.expect(copy).to.be.above(0);
                Code.expect(original).to.equal(copy);

                return done();
            });
        });
    };

    var inject = function (request) {
        server.inject(request, verify);
    };

    internals.append(file, inject);
};

exports.negative = function (server, file, done) {
    var tmp = 'test/tmp/file';

    var verify = function (response) {

        Code.expect(response.statusCode).to.equal(415);

        fs.stat(tmp, function (err) {
            Code.expect(err).to.not.be.null();

            return done();
        });
    };

    var inject = function (request) {
        server.inject(request, verify);
    };

    internals.append(file, inject);
};
