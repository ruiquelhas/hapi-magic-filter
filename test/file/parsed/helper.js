'use strict';

const fs = require('fs');

const _ = require('lodash');
const streamToPromise = require('stream-to-promise');

const common = require('../../common');

const internals = {};

internals.defaults = {
    payload: {
        output: 'file',
        parse: true
    },

    handler: function (request, reply) {

        const file = request.payload.file.path;
        const tmp = 'test/tmp/file';

        const input = fs.createReadStream(file);

        const done = function (err) {

            if (err) {
                return reply(err);
            }

            return reply();
        };

        const copy = function (data) {

            fs.writeFile(tmp, data, { flag: 'w+' }, done);
        };

        streamToPromise(input).then(copy);
    }
};

exports.boostrap = function (options, fn) {

    options = _.isFunction(arguments[1]) ? arguments[0] : {};
    fn = _.isFunction(arguments[1]) ? arguments[1] : arguments[0];

    common.boostrap(internals.defaults, options, fn);
};
