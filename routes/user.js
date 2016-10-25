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

  // Updates the user
  router.put('/', isAuthenticated, function(req, res, next) {
    var user = User.forge(req.body);
    userService.updateUser(user).then(function(user) {
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

  // Get an user by Email
  router.get('/emails/:email', function(req, res, next) {
    userService.getUserByEmail(req.params.email, req.query.related, false).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.post('/email/verify', function(req, res, next) {
    userService.verifyEmail(req.body.hash).then(function() {
      res.json({});
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/users', router);

};