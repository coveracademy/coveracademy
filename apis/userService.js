'use strict';

var models          = require('../models'),
    settings        = require('../configs/settings'),
    logger          = require('../configs/logger'),
    pagination      = require('../utils/pagination'),
    entities        = require('../utils/entities'),
    notifier        = require('./internal/notifier'),
    postman         = require('./internal/postman'),
    messages        = require('./internal/messages'),
    constants       = require('./internal/constants'),
    moment          = require('moment').utc,
    momentTz        = require('moment-timezone').tz,
    Promise         = require('bluebird'),
    _               = require('lodash'),
    ValidationError = require('bookshelf-filteration').ValidationError,
    NotFoundError   = models.Bookshelf.NotFoundError,
    User            = models.User,
    $               = this;

exports.listUsers = function(ids) {
  return User.collection().query(function(qb) {
    qb.whereIn('id', ids);
  }).fetch();
}