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
      return contestService.listAuditions(this.contests);
    }).then(function(auditions) {
      this.auditions = auditions;
      return Promise.props({
        total_votes: contestService.totalVotes(this.auditions), 
        total_comments: contestService.totalComments(this.auditions),
        users: userService.listUsers(this.auditions.pluck('user_id'))
      });
    }).then(function(result) {
      this.total_votes = result.total_votes;
      this.total_comments = result.total_comments;
      this.users = result.users;
      res.json(this);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/views', router);

};