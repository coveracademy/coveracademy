'use strict';

var User   = require('../models').User,
    logger = require('./logger');

exports.configure = function(app) {
  logger.info('Configuring middlewares');

  // Aditional headers
  app.use(function(req, res, next) {
    // Header to identify response from CoverAcademy server
    res.setHeader('X-CoverAcademy', 'Yes');
    // Sets the client version
    req.version = req.get('X-Version') ? parseInt(req.get('X-Version')) : 0;
    return next();
  });
  // Sets the user model as a request attribute if the user has a session
  app.use(function(req, res, next) {
    if(req.session.user) {
      req.user = User.forge(req.session.user);
    }
    next();
  });
};