'use strict';

var fs = require('fs');

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

internals.validateStreamData = function (stream, fn) {

    var validate = function (data) {
        return internals.validateBufferData(data, function (err) {
            stream.emit('end', err);
        });
    };

    var done = function (err) {
        if (err) {
            return fn(err);
        }

        return fn();
    };

    stream.on('data', validate).on('end', done);
};

internals.validateTemporaryFileData = function (file, fn) {

    var stream = fs.createReadStream(file);
    return internals.validateStreamData(stream, fn);
};

internals.parseFormData = function (form) {

    return function (key, fn) {
        var data = form[key];

        if (data instanceof Buffer) {
            return internals.validateBufferData(data, fn);
        }

        if (_.isObject(data) && _.has(data, 'path')) {
            return internals.validateTemporaryFileData(data.path, fn);
        }

        return fn();
    };
};

internals.parseBufferPayload = function (request, buffer, options, fn) {

    var _validate = function (err, parsed) {
        if (err) {
            return fn(err);
        }

        var items = _.keys(parsed.payload);
        var iterator = internals.parseFormData(parsed.payload);

        async.each(items, iterator, fn);
    };

    var stream = Wreck.toReadableStream(buffer);
    stream.headers = request.headers;

    return Subtext.parse(stream, null, options, _validate);
};

internals.validateRawDataPayload = function (request, fn) {

    var options = {
        output: 'data',
        parse: true
    };

    var buffer = request.payload;

    return internals.parseBufferPayload(request, buffer, options, fn);
};

internals.validateRawFilePayload = function (request, fn) {

    var options = {
        output: 'data',
        parse: true
    };

    var _read = function (err, data) {
        if (err) {
            return fn();
        }

        internals.parseBufferPayload(request, data, options, fn);
    };

    fs.readFile(request.payload.path, _read);
};

internals.validate = function (request, options, fn) {

    var payload = request.payload;

    if (payload instanceof Buffer) {
        return internals.validateRawDataPayload(request, fn);
    }

    if (_.isObject(payload) && _.has(payload, 'path')) {
        return internals.validateRawFilePayload(request, fn);
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
