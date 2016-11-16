'use strict';

var userService     = require('../apis/userService'),
    messages        = require('../apis/internals/messages'),
    logger          = require('../configs/logger'),
    settings        = require('../configs/settings'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    User            = require('../models').User,
    _               = require('lodash');

module.exports = function(router, app) {

  // Creates a new user
  router.post('/', function(req, res, next) {
    userService.createUser(req.body.first_name, req.body.last_name, req.body.phone, req.body.email, req.body.password, req.body.language, req.body.invitation_id).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  // Get authenticated user
  router.get('/authenticated', isAuthenticated, function(req, res, next) {
    res.json(req.user);
  });

  // Get an user by ID
  router.get('/:id', isAuthenticated, function(req, res, next) {
    userService.getUser(req.params.id, req.query.related).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  // Turns a fan of user
  router.post('/:user_id/fans', isAuthenticated, function(req, res, next) {
    var user = User.forge({id: req.params.user_id});
    userService.fan(req.user, user).then(function() {
      res.json();
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  // Unfan a user
  router.delete('/:user_id/fans', isAuthenticated, function(req, res, next) {
    var user = User.forge({id: req.params.user_id});
    userService.unfan(req.user, user).then(function() {
      res.json();
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/users', router);

};