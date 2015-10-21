'use strict';

var fs = require('fs');
var Readable = require('stream').Readable;

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
    }
};

internals.mapWhitelist = function (original, fresh) {

    var filter = function (value, key) {

        return _.contains(fresh.allowed, key);
    };

    if (_.isArray(fresh.allowed)) {

        return _.pick(original, filter);

    }

    return fresh.allowed;
};

internals.isSupported = function (hex, wl, fn) {

    var whitelist;
    var ref = internals.defaults.whitelist;

    if (_.has(wl, 'allowed')) {
        whitelist = internals.mapWhitelist(ref, wl);
    } else {
        whitelist = ref;
    }

    var supported = _.pick(whitelist, function (value) {

        return value === hex;
    });

    if (_.isEmpty(supported)) {
        return fn(new Error());
    }

    return fn();
};

internals.validateBuffer = function (buffer, wl, fn) {

    var data = buffer.toString('hex').slice(0, 4);
    return internals.isSupported(data, wl, fn);
};

internals.validateStream = function (stream, wl, fn) {

    var done = function (err) {

        if (err) {
            return fn(err);
        }

        return fn();
    };

    var validate = function (data) {

        return internals.validateBuffer(data, wl, done);
    };

    stream.on('data', validate);
};

internals.validateTemporaryFile = function (file, wl, fn) {

    var stream = fs.createReadStream(file);
    return internals.validateStream(stream, wl, fn);
};

internals.validateFormFields = function (form, wl) {

    return function (key, fn) {

        var field = form[key];

        if (field instanceof Buffer) {
            return internals.validateBuffer(field, wl, fn);
        }

        if (_.has(field, 'path')) {
            var file = field.path;
            return internals.validateTemporaryFile(file, wl, fn);
        }

        if (field instanceof Readable) {
            var buffer = field._data;
            return internals.validateBuffer(buffer, wl, fn);
        }

        return fn();
    };
};

internals.parseBufferPayload = function (stream, wl, fn) {

    var _validate = function (err, parsed) {

        if (err) {
            return fn(err);
        }

        var payload = parsed.payload;
        var items = _.keys(payload);
        var iterator = internals.validateFormFields(payload, wl);

        async.each(items, iterator, fn);
    };

    var options = {
        output: 'data',
        parse: true
    };

    return Subtext.parse(stream, null, options, _validate);
};

internals.validateRawDataPayload = function (request, wl, fn) {

    var stream = Wreck.toReadableStream(request.payload);
    stream.headers = request.headers;

    return internals.parseBufferPayload(stream, wl, fn);
};

internals.validateRawFilePayload = function (request, wl, fn) {

    var _read = function (err, data) {

        if (err) {
            return fn(err);
        }

        var stream = Wreck.toReadableStream(data);
        stream.headers = request.headers;

        internals.parseBufferPayload(stream, wl, fn);
    };

    fs.readFile(request.payload.path, _read);
};

internals.validateRawStreamPayload = function (request, wl, fn) {

    var stream = request.payload;
    stream.headers = request.headers;

    return internals.parseBufferPayload(stream, wl, fn);
};

internals.validate = function (request, wl, fn) {

    var payload = request.payload;

    if (payload instanceof Buffer) {
        return internals.validateRawDataPayload(request, wl, fn);
    }

    if (_.has(payload, 'path')) {
        return internals.validateRawFilePayload(request, wl, fn);
    }

    if (payload instanceof Readable) {
        return internals.validateRawStreamPayload(request, wl, fn);
    }

    var items = _.keys(payload);
    var iterator = internals.validateFormFields(payload, wl);

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

    return next();
};

exports.register.attributes = {
    name: 'hapi-magic-filter',
    version: '1.0.0'
};
