'use strict';

var contestService  = require('../apis/contestService'),
    userService     = require('../apis/userService'),
    messages        = require('../apis/internals/messages'),
    constants       = require('../apis/internals/constants'),
    logger          = require('../configs/logger'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    Promise         = require('bluebird');

module.exports = function(router, app) {

  router.get('/auditions', isAuthenticated, function(req, res, next) {
    contestService.listRunningContests().bind({}).then(function(contests) {
      this.contests = contests;
      return contestService.listRandomAuditions(contests, ['user']);
    }).then(function(auditions) {
      this.auditions = auditions;
      return Promise.all([
        contestService.totalLikes(auditions),
        contestService.totalComments(auditions)
      ]);
    }).spread(function(totalLikes, totalComments) {
      var auditionsView = [];
      var context = this;
      this.auditions.forEach(function(audition) {
        audition.relations.contest = context.contests.get(audition.get('contest_id'));
        auditionsView.push({
          audition: audition,
          total_likes: totalLikes[audition.id],
          total_comments: totalComments[audition.id]
        });
      });
      res.json(auditionsView);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/contests', isAuthenticated, function(req, res, next) {
    contestService.listLatestContests(constants.FIRST_PAGE, constants.CONTESTS_PER_PAGE).bind({}).then(function(contests) {
      this.contests = contests;
      return Promise.all([
        contestService.totalAuditionsInContests(contests),
        contestService.listWinnersInContests(contests)
      ]);
    }).spread(function(totalAuditions, winners) {
      var contestsView = [];
      this.contests.forEach(function(contest) {
        contestsView.push({
          contest: contest,
          winners: winners[contest.id],
          total_auditions: totalAuditions[contest.id]
        });
      });
      res.json(contestsView);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/contests/:id', isAuthenticated, function(req, res, next) {
    var id = req.params.id;
    contestService.getContest(id).bind({}).then(function(contest) {
      this.result = {};
      this.result.contest = contest;
      return Promise.props({
        winners: contestService.listWinners(contest),
        auditions: contestService.listAuditions(contest),
        total_auditions: contestService.totalAuditions(contest)
      });
    }).then(function(result) {
      this.result.winners = result.winners;
      this.result.auditions = result.auditions;
      this.result.total_auditions = result.total_auditions;
      return Promise.props({
        total_likes: contestService.totalLikes(result.auditions),
        total_comments: contestService.totalComments(result.auditions)
      });
    }).then(function(result) {
      this.result.total_likes = result.total_likes;
      this.result.total_comments = result.total_comments;
      res.json(this.result);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/users/:id', function(req, res, next) {
    var userId = req.params.id;
    userService.findById(userId).then(function(user) {
      return Promise.props({
        fan: userService.isFan(req.user, user) === true ? 1 : 0,
        fans: userService.latestFans(user, constants.FIRST_PAGE, constants.NUMBER_OF_FANS_IN_PAGE),
        total_fans: userService.totalFans(user),
        videos: contestService.listUserAuditions(user)
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