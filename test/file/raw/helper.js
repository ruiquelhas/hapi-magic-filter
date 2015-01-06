'use strict';

var fs = require('fs');

var _ = require('lodash');
var Wreck = require('wreck');
var Subtext = require('subtext');

var common = require('../../common');

var internals = {};

internals.defaults = {
    payload: {
        output: 'file',
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

        var copy = function (err, parsed) {

            if (err) {
                return reply(err);
            }

            fs.writeFile(tmp, parsed.payload.file, done);
        };

        var read = function (err, data) {

            if (err) {
                return reply();
            }

            var stream = Wreck.toReadableStream(data);
            stream.headers = request.headers;

            Subtext.parse(stream, null, options, copy);
        };

        fs.readFile(request.payload.path, read);
    }
};

exports.boostrap = function (options, fn) {

    var options = _.isFunction(arguments[1]) ? arguments[0] : {};
    var fn = _.isFunction(arguments[1]) ? arguments[1] : arguments[0];

    common.boostrap(internals.defaults, options, fn);
};
