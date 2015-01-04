'use strict';

var _ = require('lodash');
var async = require('async');

var Subtext = require('subtext');
var Wreck = require('wreck');
var Boom = require('boom');

var internals = {};

internals.defaults = {
    whitelist: {
        'bz2': '425a',
        'jpg': 'ffd8',
        'mp4': '3367',
        'ogg': '4f67',
        'pdf': '2550',
        'png': '8950',
        'tar': '7573'
    },
};

internals.isSupported = function (hex, fn) {

    var whitelist = internals.defaults.whitelist;

    var supported = _.pick(whitelist, function (value) {
        return value === hex;
    });

    if (_.isEmpty(supported)) {
        return fn(new Error());
    }

    return fn();
};

internals.validateBufferData = function (buffer, fn) {

    var data = buffer.toString('hex').slice(0, 4);
    return internals.isSupported(data, fn);
};

internals.parseFormData = function (form) {

    return function (key, fn) {
        var data = form[key];

        if (data instanceof Buffer) {
            return internals.validateBufferData(data, fn);
        }

        return fn();
    };
};

internals.validateRawPayload = function (request, fn) {

    var options = {
        output: 'data',
        parse: true
    };

    var _validate = function (err, parsed) {
        if (err) {
            return fn(err);
        }

        var items = _.keys(parsed.payload);
        var iterator = internals.parseFormData(parsed.payload);

        async.each(items, iterator, fn);
    };

    var stream = Wreck.toReadableStream(request.payload);
    stream.headers = request.headers;

    return Subtext.parse(stream, null, options, _validate);
};

internals.validate = function (request, options, fn) {

    var payload = request.payload;

    if (payload instanceof Buffer) {
        return internals.validateRawPayload(request, fn);
    }

    var items = _.keys(payload);
    var iterator = internals.parseFormData(payload);

    async.each(items, iterator, fn);
};

internals.attach = function (options) {

    var method = 'post';
    var mime = 'multipart/form-data';

    return function (request, reply) {
        var done = function (err) {
            if (err) {
                return reply(Boom.unsupportedMediaType());
            }

            return reply.continue();
        };

        if (request.method === method && request.mime === mime) {
            options || (options = []); //jshint ignore: line

            return internals.validate(request, options, done);
        }

        return reply.continue();
    };
};

exports.register = function (plugin, options, next) {

    var handler = internals.attach(options);
    plugin.ext('onPreHandler', handler);

    next();
};

exports.register.attributes = {
    name: 'hapi-magic-filter',
    version: '1.0.0'
};
