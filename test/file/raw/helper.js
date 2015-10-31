'use strict';

const fs = require('fs');

const _ = require('lodash');
const Wreck = require('wreck');
const Subtext = require('subtext');

const common = require('../../common');

const internals = {};

internals.defaults = {
    payload: {
        output: 'file',
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

        const copy = function (err, parsed) {

            if (err) {
                return reply(err);
            }

            fs.writeFile(tmp, parsed.payload.file, done);
        };

        const read = function (err, data) {

            if (err) {
                return reply();
            }

            const stream = Wreck.toReadableStream(data);
            stream.headers = request.headers;

            Subtext.parse(stream, null, options, copy);
        };

        fs.readFile(request.payload.path, read);
    }
};

exports.boostrap = function (options, fn) {

    options = _.isFunction(arguments[1]) ? arguments[0] : {};
    fn = _.isFunction(arguments[1]) ? arguments[1] : arguments[0];

    common.boostrap(internals.defaults, options, fn);
};
