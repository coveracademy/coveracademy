'use strict';

var userService     = require('../apis/userService'),
    videoService    = require('../apis/videoService'),
    contestService  = require('../apis/contestService'),
    messages        = require('../apis/internals/messages'),
    constants       = require('../apis/internals/constants'),
    logger          = require('../configs/logger'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    models          = require('../models'),
    Promise         = require('bluebird'),
    Video           = models.Video;

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
        videoService.listLikedVideos(req.user, videos),
        userService.listIdols(req.user, videos)
      ]);
    }).spread(function(totalLikes, totalComments, likedVideos, idols) {
      var videosView = [];
      var context = this;
      this.videos.forEach(function(video) {
        video.relations.contest = context.contests.get(video.get('contest_id'));
        videosView.push({
          video: video,
          total_likes: totalLikes[video.id],
          total_comments: totalComments[video.id],
          liked: likedVideos.has(video.id),
          fan: idols.has(video.get('user_id'))
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

  router.get('/contests/join', isAuthenticated, function(req, res, next) {
    contestService.listAvailableContests().then(function(contests) {
      res.json(contests);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/contests/:contest_id', isAuthenticated, function(req, res, next) {
    var id = req.params.contest_id;
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
        liked_videos: videoService.listLikedVideos(req.user, result.videos),
        idols: userService.listIdols(req.user, result.videos)
      });
    }).then(function(result) {
      this.result.total_likes = result.total_likes;
      this.result.total_comments = result.total_comments;
      this.result.liked_videos = Array.from(result.liked_videos);
      this.result.idols = Array.from(result.idols);
      res.json(this.result);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/users/:user_id', isAuthenticated, function(req, res, next) {
    userService.getUser(req.params.user_id).then(function(user) {
      return Promise.props({
        fan: userService.isFan(req.user, user) === true ? 1 : 0,
        total_fans: userService.totalFans(user),
        videos: videoService.listUserVideos(user),
        auditions: videoService.listUserAuditions(user)
      }).then(function(result) {
        result.user = user;
        res.json(result);
      });
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  router.get('/videos/:video_id/comments', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.listComments(video, constants.FIRST_PAGE, constants.COMMENTS_PER_PAGE).then(function(comments) {
      res.json(comments);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/views', router);

};