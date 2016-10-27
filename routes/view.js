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
    contestService.runningContests().bind({}).then(function(contests) {
      this.contests = contests;
      return contestService.randomAuditions(contests);
    }).then(function(videos) {
      this.videos = videos;
      return Promise.all([
        userService.listUsers(!videos.isEmpty() ? videos.pluck('user_id') : []),
        contestService.totalLikes(videos),
        contestService.totalComments(videos)
      ]);
    }).spread(function(users, totalLikes, totalComments) {
      var videosView = [];
      var context = this;
      this.videos.forEach(function(video) {
        videosView.push({
          video: video,
          contest: context.contests.get(video.get('contest_id')),
          user: users.get(video.get('user_id')),
          total_likes: totalLikes[video.id],
          total_comments: totalComments[video.id]
        });
      });
      res.json(videosView);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/contests', function(req, res, next) {
    contestService.latestContests(constants.FIRST_PAGE, constants.CONTESTS_PER_PAGE).bind({}).then(function(contests) {
      this.contests = contests;
      return Promise.all([
        contestService.totalAuditions(contests),
        contestService.listWinners(contests)
      ]);
    }).spread(function(totalAuditions, winners) {
      var contestsView = [];
      this.contests.forEach(function(contest) {
        contestsView.push({
          contest: contest,
          total_auditions: totalAuditions[contest.id],
          winners: winners[contest.id]
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
      var videosPromise;
      if(rankType === 'best') {
        videosPromise = contestService.bestAuditions(contest);
      } else if(rankType === 'latest') {
        videosPromise = contestService.latestAuditions(contest);
      } else {
        videosPromise = contestService.randomAuditions(contest);
      }
      var winnersPromise = contest.get('progress') === 'finished' ? contestService.listWinnerAuditions(contest) : null;
      return Promise.props({
        videos: videosPromise,
        total_videos: contestService.totalAuditions(contest),
        video: contestService.getUserAudition(req.user, contest),
        winner_videos: winnersPromise,
        user_votes: contestService.listUserLikes(req.user, contest),
        total_user_votes: contestService.totalUserLikes(req.user, contest)
      }).bind({}).then(function(result) {
        this.result = result;
        return contestService.totalLikesByAudition(result.videos);
      }).then(function(votesByAudition) {
        this.result.votes_by_video = votesByAudition;
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