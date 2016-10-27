'use strict';

var models        = require('../models'),
    messages      = require('./internals/messages'),
    User          = models.User,
    NotFoundError = models.Bookshelf.NotFoundError,
    $             = this;

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