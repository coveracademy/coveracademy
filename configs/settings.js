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
      _authentication = {
        facebook: {
          clientID: '329761620528304',
          clientSecret: '9331e1f0ee96c8ea7789a22e55aacdba'
        }
      },
      _notifier = {
        host: properties.getValue('notifier.host', 'localhost'),
        port: properties.getValue('notifier.port', 3100),
        ioPort: properties.getValue('notifier.ioPort', 3101)
      },
      _postman = {
        contact: 'contact@coveracademy.com',
        apiKey: 'key-335a52e99eb6d3aac9abc94e791a6738',
        host: properties.getValue('postman.host', 'localhost'),
        port: properties.getValue('postman.port', 3200)
      },  
      _smsGateway = {
        accountSid: 'ACe016f66f70f3773a2a07b3621d64d980',
        authToken: '6f229a92172b96b5b353b51eb7a94ef7',
        phoneNumber: '+12513339933'
      };

  logger.info('Using %s environment settings', _nodeEnv);
  if(_debug === true) {
    logger.info('Debug mode is ON');
  }

  exports.authentication = _authentication;
  exports.database = _database;
  exports.debug = _debug;
  exports.domain = _domain;
  exports.nodeEnv = _nodeEnv;
  exports.nodePort = _nodePort;
  exports.notifier = _notifier;
  exports.postman = _postman;
  exports.publicPath = _publicPath;
  exports.redis = _redis;
  exports.smsGateway = _smsGateway;
  exports.website = _website;
} catch(err) {
  logger.error('Error loading settings', err);
}