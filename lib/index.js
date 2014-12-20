'use strict';

var _ = require('lodash');
var async = require('async');

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

internals.validate = function (payload, options, fn) {

    if (payload instanceof Buffer) {
        return fn(new Error());
    }

    var iterator = function (key, fn) {
        var data = payload[key];

        if (data instanceof Buffer) {
            return internals.validateBufferData(data, fn);
        }

        return fn(new Error());
    };

    async.each(_.keys(payload), iterator, fn);
};

exports.register = function (plugin, options, next) {
    var method = 'post';
    var mime = 'multipart/form-data';

    plugin.ext('onPreHandler', function (request, reply) {
        var payload = request.payload;

        var done = function (err) {
            if (err) {
                return reply(Boom.unsupportedMediaType());
            }

            return reply.continue();
        };

        if (request.method === method && request.mime === mime) {
            options || (options = []); //jshint ignore: line

            return internals.validate(payload, options, done);
        }

        return reply.continue();
    });

    next();
};

exports.register.attributes = {
    name: 'hapi-magic-filter',
    version: '1.0.0'
};
