'use strict';

var contestService  = require('../apis/contestService'),
    userService     = require('../apis/userService'),
    messages        = require('../apis/internal/messages'),
    logger          = require('../configs/logger'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    models          = require('../models'),
    Promise         = require('bluebird'),
    Contest         = models.Contest,
    User            = models.User;

module.exports = function(router, app) {

  router.get('/auditions', function(req, res, next) {
    contestService.listRunningContests().bind({}).then(function(contests) {
      this.contests = contests;
      return contestService.listAuditions(contests);
    }).then(function(auditions) {
      this.auditions = auditions;
      var usersIds = auditions.pluck('user_id');
      return userService.listUsers(usersIds);
    }).then(function(users) {
      this.users = users;
      res.json(this);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/views', router);

};