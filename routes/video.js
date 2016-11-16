'use strict';

var videoService    = require('../apis/videoService'),
    messages        = require('../apis/internals/messages'),
    settings        = require('../configs/settings'),
    logger          = require('../configs/logger'),
    files           = require('../utils/files'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    models          = require('../models'),
    Contest         = models.Contest,
    Video           = models.Video;

module.exports = function(router, app) {

  // Likes a video
  router.post('/:video_id/likes', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.like(req.user, video).then(function() {
      res.json();
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });
  
  // Dislikes a video
  router.delete('/:video_id/likes', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.dislike(req.user, video).then(function() {
      res.json();
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

  // Uploads and saves a video
  router.post('/uploads', isAuthenticated, function(req, res, next) {
    files.parseFiles(req, settings.videoUpload).bind({}).then(function(formParsed) {
      res.json();
      var contest = formParsed.fields.contest ? Contest.forge({id: formParsed.fields.contest}) : null;
      videoService.createVideo(req.user, formParsed.file, contest).then(function(video) {
        logger.info('Video created with success');
      }).catch(function(err) {
        logger.error('Error creating video', err);
      });
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/videos', router);

};