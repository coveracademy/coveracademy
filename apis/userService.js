'use strict';

var models        = require('../models'),
    messages      = require('./internals/messages'),
    User          = models.User,
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