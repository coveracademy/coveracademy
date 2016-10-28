'use strict';

var models        = require('../models'),
    messages      = require('./internals/messages'),
    constants     = require('./internals/constants'),
    Promise       = require('bluebird'),
    _             = require('lodash'),
    Bookshelf     = models.Bookshelf,
    Comment       = models.Comment,
    UserLike      = models.UserLike,
    Video         = models.Video,
    $             = this;

exports.getVideo = function(id, related) {
  return Video.forge({id: id}).fetch({withRelated: related});
};

exports.listLikedVideos = function(user, videos) {
  return UserLike.query(function(qb) {
    qb.where('user_id', user.id);
    qb.whereIn('video_id', videos.pluck('id'));
  }).fetchAll().then(function(likes) {
    var videosIds = new Set();
    likes.forEach(function(like) {
      videosIds.add(like.get('video_id'));
    });
    return videosIds;
  });
};

exports.totalLikes = function(videos) {
  if(videos.isEmpty()) {
    return Promise.resolve({});
  } 
  return Bookshelf.knex(UserLike.forge().tableName)
    .select('video_id')
    .count('id as votes')
    .whereIn('video_id', videos.pluck('id'))
    .groupBy('video_id')
  .then(function(rows) {
    var votesByVideo = {};
    rows.forEach(function(row) {
      votesByVideo[row.video_id] = row.votes;
    });
    return votesByVideo;
  });
};

exports.totalComments = function(videos) {
  if(videos.isEmpty()) {
    return Promise.resolve({});
  } 
  return Bookshelf.knex(Comment.forge().tableName)
    .select('video_id')
    .count('id as comments')
    .whereIn('video_id', videos.pluck('id'))
    .groupBy('video_id')
  .then(function(rows) {
    var commentsByVideo = {};
    rows.forEach(function(row) {
      commentsByVideo[row.video_id] = row.comments;
    });
    return commentsByVideo;
  });
};

exports.like = function(user, video) {
  return $.getVideo(video.id, ['contest']).then(function(video) {
    if(video.get('contest_id') && video.related('contest').get('progress') !== constants.CONTEST_RUNNING) {
      throw messages.apiError('video.like.contestNotRunning', 'Contest is not running');
    }
    if(video.get('approved') === 0) {
      throw messages.apiError('video.like.videoNotApproved', 'The user can not like in video not approved');
    }
    var like = UserLike.forge({user_id: user.id, video_id: video.id});
    return like.save();
  }).catch(function(err) {
    if(messages.isDuplicatedEntryError(err)) {
      throw messages.apiError('video.like.alreadyLiked', 'Video already liked by user', err);
    } else {
      throw err;
    }
  });
};

exports.dislike = function(user, video) {
  return $.getVideo(video.id, ['contest']).then(function(video) {
    if(video.get('contest_id') && video.related('contest').get('progress') !== constants.CONTEST_RUNNING) {
      throw messages.apiError('video.like.contestNotRunning', 'Contest is not running');
    }
    var like = UserLike.forge({user_id: user.id, video_id: video.id});
    return like.delete();
  });
};