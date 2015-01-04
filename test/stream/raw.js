'use strict';

var fs = require('fs');
var Transform = require('stream').Transform;

var Lab = require('lab');
var Wreck = require('wreck');
var Subtext = require('subtext');

var lab = exports.lab = Lab.script();

var common = require('../common');

lab.describe('Stream raw upload', function () {

    var server, payload;

    lab.before(function (done) {

        payload = {
            output: 'stream',
            parse: false
        };

        var handler = function (request, reply) {

            var options = {
                output: 'data',
                parse: true
            };

            var copy = function (err, parsed) {
                console.log('err:', err);
                console.log('parsed:', parsed);
                return reply();
            };

            console.log('request.payload:', request.payload);

            var stream = request.payload;
            stream.headers = request.headers;

            Subtext.parse(stream, null, options, copy);
        };

        var config = {
            payload: payload,
            handler: handler
        };

        common.boostrap(config, function (err, instance) {

            if (err) {
                return done(err);
            }

            server = instance;
            return done();
        });
    });

    lab.afterEach(function (done) {

        fs.unlink('test/tmp/file', function () {
            return done();
        });
    });

    lab.test('Returns OK if media type is supported.', function (done) {
        common.verifyPositive(server, 'test/static/file.png', done);
    });

    lab.test('Returns error if media type is not supported', function (done) {
        common.verifyNegative(server, 'test/static/file.gif', done);
    });

});
