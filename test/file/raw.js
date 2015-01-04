// 'use strict';

// var fs = require('fs');

// var Lab = require('lab');
// var Wreck = require('wreck');
// var Subtext = require('subtext');

// var lab = exports.lab = Lab.script();

// var common = require('../common');

// lab.describe('Data raw file upload', function () {

//     var server, payload;

//     lab.before(function (done) {

//         payload = {
//             output: 'data',
//             parse: false
//         };

//         var handler = function (request, reply) {
//             var tmp = 'test/tmp/file';

//             var options = {
//                 output: 'data',
//                 parse: true
//             };

//             var done = function (err) {
//                 if (err) {
//                     return reply(err);
//                 }

//                 return reply();
//             };

//             var save = function (buffer) {
//                 return function (err, fd) {
//                     if (err) {
//                         return reply(err);
//                     }

//                     fs.write(fd, buffer, 0, buffer.length, 0, done);
//                 };
//             };

//             var open = function (err, parsed) {
//                 if (err) {
//                     return reply(err);
//                 }

//                 fs.open(tmp, 'w+', save(parsed.payload.file));
//             };

//             var stream = Wreck.toReadableStream(request.payload);
//             stream.headers = request.headers;

//             Subtext.parse(stream, null, options, open);
//         };

//         var config = {
//             payload: payload,
//             handler: handler
//         };

//         common.boostrap(config, function (err, instance) {

//             if (err) {
//                 return done(err);
//             }

//             server = instance;
//             return done();
//         });
//     });

//     lab.afterEach(function (done) {

//         fs.unlink('test/tmp/file', function () {
//             return done();
//         });
//     });

//     lab.test('Returns OK if media type is supported.', function (done) {
//         common.verifyPositive(server, 'test/static/file.png', done);
//     });

//     lab.test('Returns error if media type is not supported', function (done) {
//         common.verifyNegative(server, 'test/static/file.gif', done);
//     });

// });
