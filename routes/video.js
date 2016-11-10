'use strict';

var videoService    = require('../apis/videoService'),
    messages        = require('../apis/internals/messages'),
    settings        = require('../configs/settings'),
    logger          = require('../configs/logger'),
    files           = require('../utils/files'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    models          = require('../models'),
    Video           = models.Video;

module.exports = function(router, app) {

  // Likes a video
  router.post('/:video_id/likes', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.like(req.user, video).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });
  
  // Dislikes a video
  router.delete('/:video_id/likes', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.dislike(req.user, video).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  // Comments a video
  router.post('/:video_id/comments', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.comment(req.user, video, req.body.message).then(function(comment) {
      res.json(comment);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  // Comments a video
  router.post('/uploads', isAuthenticated, function(req, res, next) {
    files.parseFiles(req, settings.videoUpload).then(function(formParsed) {
      var video = Video.forge(formParsed.fields);
      return videoService.saveVideo(video);
    }).then(function(video) {
      res.json(video);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/videos', router);

};