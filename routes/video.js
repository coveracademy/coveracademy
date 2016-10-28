'use strict';

var videoService    = require('../apis/videoService'),
    messages        = require('../apis/internals/messages'),
    logger          = require('../configs/logger'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    models          = require('../models'),
    Video           = models.Video;

module.exports = function(router, app) {

  // Likes a video
  router.post('/likes/:video_id', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.like(req.user, video).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });
  
  // Dislikes a video
  router.delete('/likes/:video_id', isAuthenticated, function(req, res, next) {
    var video = Video.forge({id: req.params.video_id});
    videoService.dislike(req.user, video).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      logger.error(err);
      messages.respondWithError(err, res);
    });
  });

  app.use('/videos', router);

};