'use strict';

var userService = require('../apis/userService'),
    messages    = require('../apis/internals/messages'),
    logger      = require('../configs/logger'),
    passport    = require('passport');

module.exports = function(router, app) {

  router.get('/facebook', passport.authenticate('facebook-token', {session: false}), function(req, res) {
    if(req.session.user) {
      req.session.user = req.user.toJSON();
      req.session.update(function(err) {
        if(err) {
          messages.respondWithError(messages.apiError('user.auth.error', 'Error authenticating user', err), res);
        } else {
          res.json({token: req.session.jwt});
        }
      });
    } else {
      req.session.user = req.user.toJSON();
      req.session.create(null, function(err, token) {
        if(err) {
          messages.respondWithError(messages.apiError('user.auth.error', 'Error authenticating user', err), res);
        } else {
          res.json({token: token});
        }
      });
    }
  });

  router.post('/logout', function(req, res, next) {
    var user = req.user;
    req.session.destroy(function(err) {
      if(err) {
        logger.error(err);
        messages.respondWithError(messages.apiError('user.auth.logout.error', 'Error logging out user', err), res);
      } else {
        res.json();
      }
    });
  });

  app.use('/users/auth', router);

};