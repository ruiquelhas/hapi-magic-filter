var fs = require('fs');
var Stream = require('stream').Readable;

var Boom = require('boom');

var map = require('../map.json');

var internals = {};

exports = module.exports = {};

internals.validateMagicNumber = function (magic, reference, callback) {
  if (reference.indexOf(magic) > -1) {
    return callback();
  }

  return callback(new Error('The file type is not supported.'));
};

internals.validateBuffer = function (buffer, reference, callback) {
  var magic = buffer.slice(0, 2).toString('hex');
  internals.validateMagicNumber(magic, reference, callback);
};

internals.addStreamLifeCycleListeners = function (stream, reference, callback) {
  var magic;

  stream.on('data', function (buffer) {
    magic = buffer.slice(0, 2).toString('hex');
    stream.pause();
  });

  stream.on('end', function () {
    internals.validateMagicNumber(magic, reference, callback);
  });
};

internals.validateStream = function (stream, reference, callback) {
  internals.addStreamLifeCycleListeners(stream, reference, callback);
};

internals.validateFile = function (file, reference, callback) {
  internals.addStreamLifeCycleListeners(fs.createReadStream(file.path), reference, callback);
};

internals.hasValidStructure = function (obj) {
  var required = ['filename', 'path', 'headers', 'bytes'];

  return (Object.keys(obj).filter(function (key) {
    return (required.indexOf(key) > -1);
  }).length === required.length);
};

internals.validateFieldContent = function (content, reference, callback) {
  if (content instanceof Buffer) {
    internals.validateBuffer(content, reference, callback);
  } else if (content instanceof Stream) {
    internals.validateStream(content, reference, callback);
  } else if (content instanceof Object && internals.hasValidStructure(content)) {
    internals.validateFile(content, reference, callback);
  } else {
    return callback();
  }
};

internals.magicMapping = function (supported) {
  var allowed = [];

  for (var i = 0, len = supported.length; i < len; i++) {
    if (map.hasOwnProperty(supported[i])) {
      allowed.push(map[supported[i]]);
    }
  }

  return allowed;
};

internals.validate = function (payload, reference, callback) {
  var fields = Object.keys(payload), last = fields.length - 1, value, message;

  reference = internals.magicMapping(reference);

  (function _validateAllFields(index) {
    value = payload[fields[index]];
    internals.validateFieldContent(value, reference, function (err) {
      if (err) {
        message = [err.message, ' [field = ', fields[index], ']'].join('');
        return callback(Boom.unsupportedMediaType(message));
      }

      if (index === last) {
        return callback();
      }

      return _validateAllFields(index + 1);
    });
  }(0));
};

exports.register = function (plugin, options, next) {
  plugin.ext('onPreHandler', function (request, callback) {
    if (request.method === 'post' && request.mime === 'multipart/form-data') {
      return internals.validate(request.payload, options.supported, callback);
    }

    return callback();
  });

  next();
};

exports.register.attributes = {
  name: 'hapi-magic-filter',
  version: '0.1.0'
};
