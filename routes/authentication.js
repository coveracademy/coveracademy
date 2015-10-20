'use strict';

var userService = require('../apis/userService'),
    messages    = require('../apis/internal/messages'),
    logger      = require('../configs/logger');

module.exports = function(router, app) {

  router.post('/', function(req, res, next) {
    userService.authenticate(req.body.login, req.body.password, req.body.language).then(function(user) {
      req.session.user = user.toJSON();
      req.session.create(null, function(err, token) {
        if(err) {
          throw err;
        }
        res.json({token: token});
      });
    }).catch(messages.APIError, function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(messages.apiError('user.auth.error', 'Error authenticating user', err), res);
    });
  });

  router.post('/logout', function(req, res, next) {
    var user = req.user;
    req.session.destroy(function(err) {
      if (err) {
        logger.error(err);
        messages.respondWithError(messages.apiError('user.auth.logout.error', 'Error logging out user', err), res);
      } else {
        if(user) {
          userService.logout(user).catch(function(err) {
            logger.error('Error marking user %d logged out', user.id, err);
          });
        }
        res.json({});
      }
    });
  });

  app.use('/users/auth', router);

};