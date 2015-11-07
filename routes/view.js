'use strict';

var contestService  = require('../apis/contestService'),
    userService     = require('../apis/userService'),
    messages        = require('../apis/internal/messages'),
    constants       = require('../apis/internal/constants'),
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
      var auditionsView = [];
      this.auditions.forEach(function(audition) {
        auditionsView.push({
          audition: audition,
          contest: this.contests.get(audition.get('contest_id')),
          user: result.users.get(audition.get('user_id')),
          total_votes: result.total_votes[audition.id],
          total_comments: result.total_comments[audition.id]
        });      
      }, this);
      res.json(auditionsView);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/contests', function(req, res, next) {
    contestService.latestContests(constants.FIRST_PAGE, constants.NUMBER_OF_CONTESTS_IN_PAGE).bind({}).then(function(contests) {
      this.contests = contests;
      return Promise.all([contestService.totalVotesInContests(contests), contestService.totalAuditionsInContests(contests), contestService.listWinnerAuditionsInContests(contests)]);
    }).spread(function(totalVotes, totalAuditions, winnerAuditions) {
      var contestsView = [];
      this.contests.forEach(function(contest) {
        contestsView.push({
          contest: contest,
          total_votes: totalVotes[contest.id],
          total_auditions: totalAuditions[contest.id],
          winner_auditions: winnerAuditions[contest.id]
        });
      });      
      res.json(contestsView);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/user/:id', function(req, res, next) {
    var userId = req.params.id;
    userService.findById(userId).then(function(user) {
      return Promise.props({
        fan: userService.isFan(req.user, user),
        fans: userService.latestFans(user, constants.FIRST_PAGE, constants.NUMBER_OF_FANS_IN_PAGE),
        total_fans: userService.totalFans(user),
        auditions: contestService.listUserAuditions(user)
      }).then(function(result) {
        result.user = user;
        res.json(result);
      });
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/views', router);

};