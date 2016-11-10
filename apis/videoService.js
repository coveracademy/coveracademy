'use strict';

var models    = require('../models'),
    messages  = require('./internals/messages'),
    constants = require('./internals/constants'),
    Promise   = require('bluebird'),
    _         = require('lodash'),
    Bookshelf = models.Bookshelf,
    Comment   = models.Comment,
    Like      = models.Like,
    Video     = models.Video,
    $         = this;

var commentWithUserRelated = {withRelated: ['user']};

exports.getVideo = function(id, related) {
  return Video.forge({id: id}).fetch({withRelated: related});
};

exports.saveVideo = function(video) {
  return video.save();
};

exports.listLikedVideos = function(user, videos) {
  return Like.query(function(qb) {
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

exports.listComments = function(video, page, pageSize) {
  return Comment.query(function(qb) {
    qb.where('video_id', video.id);
    qb.whereNull('comment_id');
    qb.orderBy('send_date', 'asc');
    if(page && pageSize) {
      qb.offset((page - 1) * pageSize);
      qb.limit(pageSize);
    }
  }).fetchAll(commentWithUserRelated);
};

exports.totalLikes = function(videos) {
  if(videos.isEmpty()) {
    return Promise.resolve({});
  } 
  return Bookshelf.knex(Like.forge().tableName)
    .select('video_id')
    .count('* as votes')
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
      throw messages.apiError('video.like.videoNotApproved', 'The user can not like a not approved video');
    }
    var like = Like.forge({user_id: user.id, video_id: video.id});
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
    return Like.where({user_id: user.id, video_id: video.id}).destroy();
  });
};

exports.comment = function(user, video, message) {
  return Promise.resolve().bind({}).then(function() {
    this.message = message;
    if(message === '') {
      throw messages.apiError('video.comment.empty', 'The message can not be empty');
    }
    return $.getVideo(video.id);
  }).then(function(video) {
    if(video.get('approved') === 0) {
      throw messages.apiError('video.comment.videoNotApproved', 'The user can not comment a not approved video');
    }
    var comment = Comment.forge({user_id: user.id, video_id: video.id, message: message});
    return comment.save();
  });
};