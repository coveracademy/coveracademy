'use strict';

var userService     = require('../apis/userService'),
    videoService    = require('../apis/videoService'),
    contestService  = require('../apis/contestService'),
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
    }).then(function(videos) {
      this.videos = videos;
      return Promise.all([
        videoService.totalLikes(videos),
        videoService.totalComments(videos),
        videoService.listLikedVideos(req.user, videos)
      ]);
    }).spread(function(totalLikes, totalComments, likedVideos) {
      var videosView = [];
      var context = this;
      this.videos.forEach(function(video) {
        video.relations.contest = context.contests.get(video.get('contest_id'));
        videosView.push({
          video: video,
          total_likes: totalLikes[video.id],
          total_comments: totalComments[video.id],
          liked: likedVideos.has(video.id)
        });
      });
      res.json(videosView);
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
    }).spread(function(totalVideos, winners) {
      var contestsView = [];
      this.contests.forEach(function(contest) {
        contestsView.push({
          contest: contest,
          winners: winners[contest.id],
          total_videos: totalVideos[contest.id]
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
        videos: contestService.listAuditions(contest),
        total_videos: contestService.totalAuditions(contest)
      });
    }).then(function(result) {
      this.result.winners = result.winners;
      this.result.videos = result.videos;
      this.result.total_videos = result.total_videos;
      return Promise.props({
        total_likes: videoService.totalLikes(result.videos),
        total_comments: videoService.totalComments(result.videos),
        liked_videos: videoService.listLikedVideos(req.user, result.videos)
      });
    }).then(function(result) {
      this.result.total_likes = result.total_likes;
      this.result.total_comments = result.total_comments;
      this.result.liked_videos = Array.from(result.liked_videos);
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
        videos: videoService.listUserAuditions(user)
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