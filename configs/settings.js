'use strict';

var properties = require('./properties'),
    logger     = require('./logger'),
    path       = require('path'),
    mkdirp     = require('mkdirp');

try {
  var _debug = properties.getValue('app.debug', false),
      _nodeEnv = properties.getValue('app.env', 'dev'),
      _nodePort = properties.getValue('app.port', 3000),
      _publicPath = properties.getValue('app.publicPath', path.join(__dirname, '../public')),
      _website = 'http://www.coveracademy.com',
      _domain = 'coveracademy.com',
      _database = {
        dialect: properties.getValue('database.dialect', 'mysql'),
        host: properties.getValue('database.host', 'localhost'),
        port: properties.getValue('database.port', 3306),
        user: properties.getValue('database.user', 'root'),
        password: properties.getValue('database.password'),
        debug: properties.getValue('database.debug', false)
      },
      _redis = {
        host: properties.getValue('redis.host', 'localhost'),
        port: properties.getValue('redis.port', 6379),
        password: properties.getValue('redis.password')
      },
      _postman = {
        contact: 'contact@coveracademy.com',
        apiKey: 'key-335a52e99eb6d3aac9abc94e791a6738',
        host: properties.getValue('postman.host', 'localhost'),
        port: properties.getValue('postman.port', 3200)
      },
      _authentication = {
        facebook: {
          clientID: '329761620528304',
          clientSecret: '9331e1f0ee96c8ea7789a22e55aacdba'
        }
      },
      _aws = {
        credentials: {
          accessKeyId: properties.getValue('aws.key'),
          secretAccessKey: properties.getValue('aws.secret'),
          region: properties.getValue('aws.region')
        },
        buckets: {
          videos: 'com.coveracademy.videos'
        }
      },
      _videoUpload = {
        directory: path.join(_publicPath, 'media/videos'),
        encoding: 'utf-8'
      };

  // Create media directories
  mkdirp.sync(_videoUpload.directory);

  logger.info('Using %s environment settings', _nodeEnv);
  if(_debug === true) {
    logger.info('Debug mode is ON');
  }

  exports.authentication = _authentication;
  exports.aws = _aws;
  exports.database = _database;
  exports.debug = _debug;
  exports.domain = _domain;
  exports.nodeEnv = _nodeEnv;
  exports.nodePort = _nodePort;
  exports.postman = _postman;
  exports.publicPath = _publicPath;
  exports.redis = _redis;
  exports.videoUpload = _videoUpload;
  exports.website = _website;
} catch(err) {
  logger.error('Error loading settings', err);
}