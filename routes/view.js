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

  router.get('/contests', function(req, res, next) {
    contestService.latestContests(constants.FIRST_PAGE, constants.NUMBER_OF_CONTESTS_IN_PAGE).then(function(contests) {
      return Promise.all([contestService.totalVotesInContests(contests), contestService.totalAuditionsInContests(contests), contestService.listWinnerAuditionsInContests(contests)]).spread(function(totalVotes, totalAuditions, winnerAuditions) {
        res.json({
          contests: contests,
          totalVotes: totalVotes,
          totalAuditions: totalAuditions,
          winnerAuditions: winnerAuditions
        });
      });
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/user/:id', function(req, res, next) {
    var userId = req.params.id;
    userService.getUser(userId, true).then(function(user) {
      if(!user) {
        messages.respondWithNotFound(res);
      } else {
        return Promise.props({
          fan: userService.isFan(req.user, user),
          fans: userService.latestFans(user, constants.FIRST_PAGE, constants.NUMBER_OF_FANS_IN_PAGE),
          total_fans: userService.totalFans(user),
          auditions: contestService.listUserAuditions(user)
        }).then(function(result) {
          result.user = user;
          res.json(result);
        });
      }
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/views', router);

};