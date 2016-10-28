'use strict';

var userService = require('../apis/userService'),
    messages    = require('../apis/internals/messages'),
    settings    = require('./settings'),
    logger      = require('./logger'),
    passport    = require('passport'),
    FBStrategy  = require('passport-facebook-token'),
    _           = require('lodash');

exports.configure = function(app) {
  logger.info('Configuring authentication');

  app.use(passport.initialize());

  passport.use(new FBStrategy(_.extend(settings.authentication.facebook, {passReqToCallback: true}), function(req, accessToken, refreshToken, profile, done) {
    var email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    var picture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
    userService.getUserByFacebookAccount(profile.id).catch(messages.NotFoundError, function(err) {
      return userService.createUser(profile.name.givenName, profile.name.familyName, email, profile.id, picture);
    }).then(function(user) {
      done(null, user);
    }).catch(function(err) {
      done(err);
    });
  }));
};