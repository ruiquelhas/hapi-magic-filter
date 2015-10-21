'use strict';

var fs = require('fs');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var helper = require('./helper');
var common = require('../../common');

var internals = {};

lab.describe('raw temporary file upload', function () {

    var server;

    lab.describe('with default whitelist', function () {

        lab.beforeEach(function (done) {

            helper.boostrap(function (err, instance) {

                if (err) {
                    return done(err);
                }

                server = instance;
                return done();
            });
        });

        lab.test('returns control if media type is supported.', function (done) {

            common.positive(server, 'test/static/file.png', done);
        });

        lab.test('returns error if media type is not supported', function (done) {

            common.negative(server, 'test/static/file.gif', done);
        });
    });

    lab.describe('with selection whitelist', function () {

        lab.beforeEach(function (done) {

            var options = {
                allowed: ['png']
            };

            helper.boostrap(options, function (err, instance) {

                if (err) {
                    return done(err);
                }

                server = instance;
                return done();
            });
        });

        lab.test('returns control if media type is supported.', function (done) {

            common.positive(server, 'test/static/file.png', done);
        });

        lab.test('returns error if media type is not supported', function (done) {

            common.negative(server, 'test/static/file.gif', done);
        });
    });

    lab.describe('with custom whitelist', function () {

        lab.beforeEach(function (done) {

            var options = {
                allowed: {
                    'png': '8950',
                    'gif': '4749'
                }
            };

            helper.boostrap(options, function (err, instance) {

                if (err) {
                    return done(err);
                }

                server = instance;
                return done();
            });
        });

        lab.test('returns control if media type is supported.', function (done) {

            common.positive(server, 'test/static/file.png', done);
        });

        lab.test('returns error if media type is not supported', function (done) {

            common.positive(server, 'test/static/file.gif', done);
        });
    });

    lab.afterEach(function (done) {

        fs.unlink('test/tmp/file', function () {

            return done();
        });
    });

});
