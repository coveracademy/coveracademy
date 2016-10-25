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
  app.use(passport.session());

  passport.serializeUser(function(user, done) {
    if(user.id) {
      done(null, user.id);
    } else {
      done(null, user);
    }
  });

  passport.deserializeUser(function(user, done) {
    if(_.isObject(user)) {
      done(null, user);
    } else {
      userService.getUser(user).catch(function(err) {
        throw messages.apiError('user.session.errorDeserializing', 'Error deserializing user from session', err);
      }).nodeify(done);
    }
  });

  passport.use(new FBStrategy(settings.authentication.facebook, function(accessToken, refreshToken, profile, done) {
    var email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    var picture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
    userService.getUserByFacebookAccount(profile.id).catch(messages.NotFoundError, function(err) {
      return userService.create(profile.id, profile.displayName, email, picture);
    }).then(function(user) {
      done(null, user);
    }).catch(function(err) {
      done(err);
    });
  }));
};