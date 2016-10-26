'use strict';

var contestService  = require('../apis/contestService'),
    userService     = require('../apis/userService'),
    messages        = require('../apis/internals/messages'),
    constants       = require('../apis/internals/constants'),
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
      return contestService.listAuditionsInContests(this.contests);
    }).then(function(auditions) {
      this.auditions = auditions;
      return Promise.props({
        total_votes: contestService.totalVotes(this.auditions),
        total_comments: contestService.totalComments(this.auditions),
        users: userService.listUsers(this.auditions.pluck('user_id'))
      });
    }).then(function(result) {
      var auditionsView = [];
      var context = this;
      this.auditions.forEach(function(audition) {
        auditionsView.push({
          audition: audition,
          contest: context.contests.get(audition.get('contest_id')),
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

  router.get('/contests/:id', function(req, res, next) {
    var id = req.params.id;
    contestService.getContest(id).then(function(contest) {
      var rankType;
      if(contest.get('progress') === 'waiting') {
        rankType = 'latest';
      } else if(contest.get('progress') == 'finished') {
        rankType = 'best';
      } else {
        rankType = req.query.rank || 'random';
      }
      var auditionsPromise;
      if(rankType === 'best') {
        auditionsPromise = contestService.bestAuditions(contest);
      } else if(rankType === 'latest') {
        auditionsPromise = contestService.latestAuditions(contest);
      } else {
        auditionsPromise = contestService.randomAuditions(contest);
      }
      var winnersPromise = contest.get('progress') === 'finished' ? contestService.listWinnerAuditions(contest) : null;
      return Promise.props({
        auditions: auditionsPromise,
        total_auditions: contestService.totalAuditions(contest),
        audition: contestService.getUserAudition(req.user, contest),
        winner_auditions: winnersPromise,
        user_votes: contestService.listUserVotes(req.user, contest),
        total_user_votes: contestService.totalUserVotes(req.user, contest)
      }).bind({}).then(function(result) {
        this.result = result;
        return contestService.totalVotesByAudition(result.auditions);
      }).then(function(votesByAudition) {
        this.result.votes_by_audition = votesByAudition;
        this.result.contest = contest;
        this.result.rank_type = rankType;
        return this.result;
      });
    }).then(function(result) {
      res.json(result);
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