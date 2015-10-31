'use strict';

const fs = require('fs');

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const helper = require('./helper');
const common = require('../../common');

const internals = {};

lab.describe('parsed data upload', () => {

    let server;

    lab.describe('with default whitelist', () => {

        lab.beforeEach((done) => {

            helper.boostrap((err, instance) => {

                if (err) {
                    return done(err);
                }

                server = instance;
                return done();
            });
        });

        lab.test('returns control if media type is supported.', (done) => {

            common.positive(server, 'test/static/file.png', done);
        });

        lab.test('returns error if media type is not supported', (done) => {

            common.negative(server, 'test/static/file.gif', done);
        });
    });

    lab.describe('with selection whitelist', () => {

        lab.beforeEach((done) => {

            const options = {
                allowed: ['png']
            };

            helper.boostrap(options, (err, instance) => {

                if (err) {
                    return done(err);
                }

                server = instance;
                return done();
            });
        });

        lab.test('returns control if media type is supported.', (done) => {

            common.positive(server, 'test/static/file.png', done);
        });

        lab.test('returns error if media type is not supported', (done) => {

            common.negative(server, 'test/static/file.gif', done);
        });
    });

    lab.describe('with custom whitelist', () => {

        lab.beforeEach((done) => {

            const options = {
                allowed: {
                    'png': '8950',
                    'gif': '4749'
                }
            };

            helper.boostrap(options, (err, instance) => {

                if (err) {
                    return done(err);
                }

                server = instance;
                return done();
            });
        });

        lab.test('returns control if media type is supported.', (done) => {

            common.positive(server, 'test/static/file.png', done);
        });

        lab.test('returns error if media type is not supported', (done) => {

            common.positive(server, 'test/static/file.gif', done);
        });
    });

    lab.afterEach((done) => {

        fs.unlink('test/tmp/file', () => {

            return done();
        });
    });

});
