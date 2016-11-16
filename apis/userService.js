'use strict';

var models        = require('../models'),
    messages      = require('./internals/messages'),
    Promise       = require('bluebird'),
    User          = models.User,
    Fan           = models.Fan,
    NotFoundError = models.Bookshelf.NotFoundError,
    $             = this;

exports.createUser = function(firstName, lastName, email, facebookAccount, facebookPicture) {
  return Promise.resolve().then(function() {
    var user = User.forge();
    user.set('first_name', firstName);
    user.set('last_name', lastName);
    user.set('email', email);
    user.set('facebook_account', facebookAccount);
    user.set('facebook_picture', facebookPicture);
    return user.save();
  });
};

exports.getUser = function(id, require) {
  var options = {require: require === false ? false : true};
  return User.forge({id: id}).fetch(options).catch(NotFoundError, function(err) {
    throw messages.notFoundError('user.doesNotExist', 'User does not exist', err);
  });
};

exports.getUserByFacebookAccount = function(facebookAccount, require) {
  var options = {require: require === false ? false : true};
  return User.forge({facebook_account: facebookAccount}).fetch(options).catch(NotFoundError, function(err) {
    throw messages.notFoundError('user.doesNotExist', 'User does not exists', err);
  });
};

exports.listUsers = function(ids) {
  return User.query('whereIn', 'id', ids).fetchAll();
};

exports.fan = function(user, related) {
  return Promise.resolve().bind({}).then(function() {
    if(user.id === related.id) {
      throw messages.apiError('user.fan.canNotFanYourself', 'You can not fan yourself');
    }
    return Fan.forge({user_id: user.id, related_id: related.id}).save();
  }).catch(function(err) {
    if(messages.isDuplicatedEntryError(err)) {
      throw messages.apiError('user.fan.alreadyFan', 'User is already a fan', err);
    } else {
      throw err;
    }
  });
};

exports.unfan = function(user, related) {
  return Fan.where({user_id: user.id, related_id: related.id}).destroy();
};

exports.listIdols = function(user, videos) {
  return Fan.query(function(qb) {
    qb.where('user_id', user.id);
    qb.whereIn('related_id', videos.pluck('user_id'));
  }).fetchAll().then(function(fans) {
    var usersIds = new Set();
    fans.forEach(function(fan) {
      usersIds.add(fan.get('related_id'));
    });
    return usersIds;
  });
};