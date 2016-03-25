'use strict';

var User   = require('../models').User;
var logger = require('./logger');

exports.configure = function(app) {
  logger.info('Configuring middlewares');

  // Aditional header to identify response from Cover Academy server
  app.use(function(req, res, next) {
    res.setHeader('X-Cover-Academy', 'Yes');
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