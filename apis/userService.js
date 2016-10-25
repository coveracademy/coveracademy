'use strict';

var models          = require('../models'),
    settings        = require('../configs/settings'),
    logger          = require('../configs/logger'),
    pagination      = require('../utils/pagination'),
    entities        = require('../utils/entities'),
    notifier        = require('./internals/notifier'),
    postman         = require('./internals/postman'),
    messages        = require('./internals/messages'),
    constants       = require('./internals/constants'),
    moment          = require('moment').utc,
    momentTz        = require('moment-timezone').tz,
    Promise         = require('bluebird'),
    _               = require('lodash'),
    ValidationError = require('bookshelf-filteration').ValidationError,
    User            = models.User,
    Bookshelf       = models.Bookshelf,
    NotFoundError   = Bookshelf.NotFoundError,
    $               = this;

exports.getUser = function(id, related, require) {
  var options = _.assign(related ? {withRelated: related} : {}, {require: require === false ? false : true});
  return User.forge({id: id}).fetch(options).catch(NotFoundError, function(err) {
    throw messages.notFoundError('user.doesNotExist', 'User does not exist', err);
  });
};

exports.getUserByFacebookAccount = function(facebookAccount, related, require) {
  var options = _.assign(related ? {withRelated: related} : {}, {require: require === false ? false : true});
  return User.forge({facebook_account: facebookAccount}).fetch(options).catch(NotFoundError, function(err) {
    throw messages.notFoundError('user.doesNotExist', 'User does not exists', err);
  });
};

exports.listUsers = function(ids, related) {
  return User.query('whereIn', 'id', ids).fetchAll({withRelated: related});
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