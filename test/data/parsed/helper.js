'use strict';

var fs = require('fs');

var _ = require('lodash');

var common = require('../../common');

var internals = {};

internals.defaults = {
    payload: {
        output: 'data',
        parse: true
    },

    handler: function (request, reply) {

        var buffer = request.payload.file;
        var tmp = 'test/tmp/file';

        var done = function (err) {

            if (err) {
                return reply(err);
            }

            return reply();
        };

        var save = function (err, fd) {

            if (err) {
                return reply(err);
            }

            fs.write(fd, buffer, 0, buffer.length, 0, done);
        };

        fs.open(tmp, 'w+', save);
    }
};

exports.boostrap = function (options, fn) {

    var options = _.isFunction(arguments[1]) ? arguments[0] : {};
    var fn = _.isFunction(arguments[1]) ? arguments[1] : arguments[0];

    common.boostrap(internals.defaults, options, fn);
};
