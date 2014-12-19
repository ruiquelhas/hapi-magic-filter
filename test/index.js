var fs = require('fs');

var _ = require('lodash');
var Hapi = require('hapi');
var Lab = require('lab');
var Code = require('code');
var FormData = require('form-data');
var streamToPromise = require('stream-to-promise');

var lab = exports.lab = Lab.script();

var plugin = require('../');

var internals = {};

internals.boostrap = function (config /*, options, fn */) {

    var options = _.isFunction(arguments[2]) ? arguments[1] : {};
    var fn = _.isFunction(arguments[2]) ? arguments[2] : arguments[1];

    var server = new Hapi.Server();
    var props = {
        register: plugin,
        options: options
    };

    server.connection();
    server.register(props, function (err) {

        if (err) {
            return fn(err);
        }

        server.route({
            path: '/',
            method: 'POST',
            config: config
        });

        return fn(null, server);

    });
};

internals.append = function (file, fn) {

    var form = new FormData();
    form.append('file', fs.createReadStream(file));

    var options = {
        url: '/',
        method: 'POST',
        headers: form.getHeaders()
    };

    streamToPromise(form).then(function (payload) {

        options.payload = payload;
        return fn(options);
    });
};


lab.describe('Data parsing-enabled file upload', function () {

    var server, payload;

    lab.before(function (done) {

        var config = {
            payload: {
                output: 'data',
                parse: true
            },
            handler: function (request, reply) {
                return reply();
            }
        };

        internals.boostrap(config, function (err, instance) {

            if (err) {
                return done(err);
            }

            server = instance;
            return done();
        });
    });

    lab.test('Returns OK if the media type is supported.', function (done) {

        var file = 'test/static/file.png';
        internals.append(file, function (request) {

            server.inject(request, function (response) {

                Code.expect(response.statusCode).to.equal(200);
                return done();
            });
        });
    });

    lab.test('Returns error if the media type is not supported', function (done) {

        var file = 'test/static/file.gif';
        internals.append(file, function (request) {

            server.inject(request, function (response) {

                Code.expect(response.statusCode).to.equal(415);
                return done();
            });
        });
    });

});
