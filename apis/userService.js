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
    Bookshelf       = models.Bookshelf,
    NotFoundError   = Bookshelf.NotFoundError,
    User            = models.User,
    $               = this;

exports.listUsers = function(ids) {
  return User.collection().query(function(qb) {
    qb.whereIn('id', ids);
  }).fetch();
};

exports.findById = function(id) {
  return User.forge({id: id}).fetch().catch(NotFoundError, function(err) {
    throw messages.notFoundError('user.notFound', 'User not found', err);
  });
};

exports.isFan = function(fan, user) {
  if(!fan || !user) {
    return Promise.resolve(false);
  } else {
    return UserFan.forge({user_id: user.id, fan_id: fan.id}).fetch().then(function(fan) {
      return fan ? true  : false;
    });
  }
};

exports.latestFans = function(user, page, pageSize) {
  return User.collection().query(function(qb) {
    qb.join('user_fan', 'user.id', 'user_fan.fan_id');
    qb.where('user_fan.user_id', user.id);
    qb.orderBy('user_fan.registration_date', 'desc');
    if(page && pageSize) {
      qb.offset((page - 1) * pageSize);
      qb.limit(pageSize);
    }
  }).fetch();
};

exports.totalFans = function(user) {
  return Bookshelf.knex('user_fan')
    .count('id as total_fans')
    .where('user_id', user.id)
    .then(function(rows) {
      return rows[0].total_fans;
    });
};