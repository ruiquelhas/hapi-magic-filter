'use strict';

var fs = require('fs');

var _ = require('lodash');
var streamToPromise = require('stream-to-promise');

var common = require('../../common');

var internals = {};

internals.defaults = {
    payload: {
        output: 'stream',
        parse: true
    },

    handler: function (request, reply) {

        var tmp = 'test/tmp/file';
        var input = request.payload.file;

        var done = function (err) {

            if (err) {
                return reply(err);
            }

            return reply();
        };

        var copy = function (data) {

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
