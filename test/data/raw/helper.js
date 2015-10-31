'use strict';

const fs = require('fs');

const _ = require('lodash');
const Wreck = require('wreck');
const Subtext = require('subtext');

const common = require('../../common');

const internals = {};

internals.defaults = {
    payload: {
        output: 'data',
        parse: false
    },

    handler: function (request, reply) {

        const tmp = 'test/tmp/file';

        const options = {
            output: 'data',
            parse: true
        };

        const done = function (err) {

            if (err) {
                return reply(err);
            }

            return reply();
        };

        const save = function (buffer) {

            return function (err, fd) {

                if (err) {
                    return reply(err);
                }

                fs.write(fd, buffer, 0, buffer.length, 0, done);
            };
        };

        const open = function (err, parsed) {

            if (err) {
                return reply(err);
            }

            fs.open(tmp, 'w+', save(parsed.payload.file));
        };

        const stream = Wreck.toReadableStream(request.payload);
        stream.headers = request.headers;

        Subtext.parse(stream, null, options, open);
    }
};

exports.boostrap = function (options, fn) {

    options = _.isFunction(arguments[1]) ? arguments[0] : {};
    fn = _.isFunction(arguments[1]) ? arguments[1] : arguments[0];

    common.boostrap(internals.defaults, options, fn);
};
