'use strict';

var properties = require('./properties'),
    winston    = require('winston'),
    path       = require('path');

var level = properties.getValue('app.debug', false) === true ? 'debug' : 'info';
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({timestamp: true, colorize: true, level: level, debugStdout: level === 'debug' ? true : false}),
    new (winston.transports.File)({filename: path.join(__dirname, '../coveracademy.log'), level: level})
  ]
});

module.exports = logger;
module.exports.stream = {
  write: function(message, encoding) {
    logger.debug(message);
  }
};