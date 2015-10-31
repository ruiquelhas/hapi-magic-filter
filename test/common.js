'use strict';

const fs = require('fs');

const _ = require('lodash');
const Hapi = require('hapi');
const Code = require('code');

const FormData = require('form-data');
const streamToPromise = require('stream-to-promise');

const plugin = require('../');

const internals = {};

internals.append = function (file, fn) {

    const form = new FormData();
    form.append('text', 'Hello');
    form.append('file', fs.createReadStream(file));

    const options = {
        url: '/',
        method: 'POST',
        headers: form.getHeaders()
    };

    streamToPromise(form).then((payload) => {

        options.payload = payload;
        return fn(options);
    });
};


exports = module.exports = {};

exports.boostrap = function (config /*, options, fn */) {

    const options = _.isFunction(arguments[2]) ? arguments[1] : {};
    const fn = _.isFunction(arguments[2]) ? arguments[2] : arguments[1];

    const server = new Hapi.Server();
    const props = {
        register: plugin,
        options: options
    };

    server.connection();
    server.register(props, (err) => {

        if (err) {
            return fn(err);
        }

        server.route({
            path: '/',
            method: 'POST',
            config: {
                payload: config.payload,
                handler: config.handler
            }
        });

        return fn(null, server);

    });
};

exports.positive = function (server, file, done) {

    const tmp = 'test/tmp/file';

    const size = function (fileRef, fn) {

        fs.stat(fileRef, (err, stats) => {

            if (err) {
                return done(err);
            }

            return fn(null, stats.size);
        });
    };

    const verify = function (response) {

        Code.expect(response.statusCode).to.equal(200);

        size(file, (err, original) => {

            size(tmp, (err, copy) => {

                Code.expect(err).to.not.exist();
                Code.expect(copy).to.be.above(0);
                Code.expect(original).to.equal(copy);

                return done();
            });
        });
    };

    const inject = function (request) {

        server.inject(request, verify);
    };

    internals.append(file, inject);
};

exports.negative = function (server, file, done) {

    const tmp = 'test/tmp/file';

    const assert = function (err) {

        Code.expect(err).to.not.be.null();
        return done();
    };

    const verify = function (response) {

        Code.expect(response.statusCode).to.equal(415);
        fs.stat(tmp, assert);
    };

    const inject = function (request) {

        server.inject(request, verify);
    };

    internals.append(file, inject);
};
