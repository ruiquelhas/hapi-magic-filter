var fs = require('fs');
var Stream = require('stream').Readable;

var Boom = require('boom');

var config = require('config');

var internals = {};

exports = module.exports = {};

internals.validateMagicNumber = function (magic, reference, callback) {
  if (reference.indexOf(magic) > -1) {
    return callback();
  }
  return callback(new Error('The file type is not supported.'));
};

internals.parseMagicNumber = function (buffer, reference, callback) {
  var magic = buffer.slice(0, 2).toString('hex');
  internals.validateMagicNumber(magic, reference, callback);
};

internals.validateBuffer = function (buffer, reference, callback) {
  internals.parseMagicNumber(buffer, reference, callback);
};

internals.addStreamEventListeners = function (stream, reference, callback) {
  stream.on('data', function (buffer) {
    stream.pause();
    internals.parseMagicNumber(buffer, reference, callback);
  });
};

internals.validateStream = function (stream, reference, callback) {
  internals.addStreamEventListeners(stream, reference, callback);
};

internals.validateFile = function (file, reference, callback) {
  var stream = fs.createReadStream(file.path), magic;
  internals.addStreamEventListeners(stream, reference, callback);
};

internals.hasValidStructure = function (obj) {
  var required = ['filename', 'path', 'headers', 'bytes'];

  return (Object.keys(obj).filter(function (key) {
    return (required.indexOf(key) > -1 );
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

internals.allowedMagicNumbers = function (allowed) {
  var source, overriden = [];

  if (allowed.length > 0) {
    for (var i = 0, len = allowed.length; i < len; i++) {
      if (config.supported.hasOwnProperty(allowed[i])) {
        overriden.push(config.supported[allowed[i]]);
      }
    }
    return overriden;
  }

  if (!allowed.length && Object.keys(allowed).length > 0) {
    // A full magic number dictionary is provided
    source = allowed;
  } else {
    source = config.supported;
  }

  for (var type in source) {
    overriden.push(config.supported[type]);
  }

  return overriden;
};

internals.validate = function (payload, reference, callback) {
  var keys = Object.keys(payload), last = keys.length - 1, field, message;

  reference = internals.allowedMagicNumbers(reference);

  (function validateAllFields(iterator) {
    field = keys[iterator];

    internals.validateFieldContent(payload[field], reference, function (err) {
      if (err) {
        message = [err.message, ' [field = ', field, ']'].join('');
        return callback(Boom.unsupportedMediaType(message));
      }

      if (iterator === last) {
        return callback();
      }

      return validateAllFields(iterator + 1);
    });
  }(0));
};

exports.register = function (plugin, options, next) {
  plugin.ext('onPreHandler', function (request, callback) {
    if (request.method === 'post' && request.mime === 'multipart/form-data') {
      return internals.validate(request.payload, options.allowed || [], callback);
    }

    return callback();
  });

  next();
};

exports.register.attributes = {
  name: 'hapi-magic-filter',
  version: '0.1.0'
};