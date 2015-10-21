'use strict';

var fs = require('fs');

var _ = require('lodash');
var Wreck = require('wreck');
var Subtext = require('subtext');

var common = require('../../common');

var internals = {};

internals.defaults = {
    payload: {
        output: 'data',
        parse: false
    },

    handler: function (request, reply) {

        var tmp = 'test/tmp/file';

        var options = {
            output: 'data',
            parse: true
        };

        var done = function (err) {

            if (err) {
                return reply(err);
            }

            return reply();
        };

        var save = function (buffer) {

            return function (err, fd) {

                if (err) {
                    return reply(err);
                }

                fs.write(fd, buffer, 0, buffer.length, 0, done);
            };
        };

        var open = function (err, parsed) {

            if (err) {
                return reply(err);
            }

            fs.open(tmp, 'w+', save(parsed.payload.file));
        };

        var stream = Wreck.toReadableStream(request.payload);
        stream.headers = request.headers;

        Subtext.parse(stream, null, options, open);
    }
};

exports.boostrap = function (options, fn) {

    options = _.isFunction(arguments[1]) ? arguments[0] : {};
    fn = _.isFunction(arguments[1]) ? arguments[1] : arguments[0];

    common.boostrap(internals.defaults, options, fn);
};
