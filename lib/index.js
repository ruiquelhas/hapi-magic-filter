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
}

internals.validateBuffer = function (buffer, reference, callback) {
  var magic = buffer.slice(0, 2).toString('hex');
  internals.validateMagicNumber(magic, reference, callback);
};

internals.validateStream = function (stream, reference, callback) {
  var magic;

  stream.on('data', function (buffer) {
    magic = buffer.slice(0, 2).toString('hex');
    internals.validateMagicNumber(magic, reference, function (err) {
      stream.pause();
      if (err) {
        return callback(err);
      }
      return callback();
    });
  });

  stream.on('error', function (err) {
    console.log('pum');
    return callback(err);
  });
};

internals.validateFile = function (file, reference, callback) {
  var magic, stream;

  stream = fs.createReadStream(file.path);
  stream.on('data', function (buffer) {
    stream.pause();
    magic = buffer.slice(0, 2).toString('hex');
    internals.validateMagicNumber(magic, reference, callback)
  });
  stream.on('error', function (err) {
    console.log('pum');
    return callback(err);
  });
}

internals.hasValidStructure = function (obj) {
  var required = ['filename', 'path', 'headers', 'bytes'];

  return (Object.keys(obj).filter(function (key) {
    return (required.indexOf(key) > -1);
  }).length === required.length);
}

internals.validateFieldContent = function (content, reference, callback) {
  if (content instanceof Buffer) {
    internals.validateBuffer(content, reference, callback);
  } else if (content instanceof Stream) {
    internals.validateStream(content, reference, callback);
  } else if (content instanceof Object && internals.hasValidStructure(content)) {
    internals.validateFile(content, reference, callback)
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
  var iterator = 0, last = Object.keys(payload).length - 1, field, message;

  reference = internals.magicMapping(reference);

  for (field in payload) {
    internals.validateFieldContent(payload[field], reference, function (err) {
      if (err) {
        message = [err.message, ' [field = ', field, ']'].join('')
        return callback(Boom.unsupportedMediaType(message));
      }

      if (iterator === last) {
        return callback();
      }
    });

    iterator += 1;
  }
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
  version: '0.0.1'
};
