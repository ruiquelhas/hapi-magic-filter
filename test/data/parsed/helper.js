'use strict';

const fs = require('fs');

const _ = require('lodash');

const common = require('../../common');

const internals = {};

internals.defaults = {
    payload: {
        output: 'data',
        parse: true
    },

    handler: function (request, reply) {

        const buffer = request.payload.file;
        const tmp = 'test/tmp/file';

        const done = function (err) {

            if (err) {
                return reply(err);
            }

            return reply();
        };

        const save = function (err, fd) {

            if (err) {
                return reply(err);
            }

            fs.write(fd, buffer, 0, buffer.length, 0, done);
        };

        fs.open(tmp, 'w+', save);
    }
};

exports.boostrap = function (options, fn) {

    options = _.isFunction(arguments[1]) ? arguments[0] : {};
    fn = _.isFunction(arguments[1]) ? arguments[1] : arguments[0];

    common.boostrap(internals.defaults, options, fn);
};
