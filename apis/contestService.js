'use strict';

var settings        = require('../configs/settings'),
    logger          = require('../configs/logger'),
    models          = require('../models'),
    postman         = require('./internals/postman'),
    messages        = require('./internals/messages'),
    constants       = require('./internals/constants'),
    userService     = require('./userService'),
    shortid         = require('shortid'),
    moment          = require('moment').utc,
    ValidationError = require('bookshelf-filteration').ValidationError,
    Promise         = require('bluebird'),
    _               = require('lodash'),
    Bookshelf       = models.Bookshelf,
    Comment         = models.Comment,
    Contest         = models.Contest,
    User            = models.User,
    UserLike        = models.UserLike,
    Video           = models.Video,
    $               = this;

var videoRelated = {withRelated: ['user']};
var videoWithContestRelated = {withRelated: ['contest']};

exports.getContest = function(id) {
  return Contest.forge({id: id}).fetch();
};

exports.runningContests = function() {
  return Contest.collection().query(function(qb) {
    var now = new Date();
    qb.where('start_date', '<', now);
    qb.where('end_date', '>', now);
    qb.orderBy('start_date', 'asc');
  }).fetch();
};

exports.latestContests = function(page, pageSize) {
  return Contest.collection().query(function(qb) {
    qb.whereNotNull('start_date');
    qb.whereNotNull('end_date');
    qb.orderBy('start_date', 'desc');
    if(page && pageSize) {
      qb.offset((page - 1) * pageSize);
      qb.limit(pageSize);
    }
  }).fetch();
};

exports.randomAuditions = function(contests) {
  return Video.query('whereIn', 'contest_id', contests.pluck('id')).fetchAll().then(function(videos) {
    return Video.collection(videos.shuffle());
  });
};

exports.totalAuditions = function(contests) {
  return Bookshelf.knex(Video.forge().tableName)
    .select('contest_id')
    .count('id as auditions')
    .whereIn('contest_id', contests.pluck('id'))
    .groupBy('contest_id')
  .then(function(rows) {
    var auditionsByContest = {};
    rows.forEach(function(row) {
      auditionsByContest[row.contest_id] = row.auditions;
    });
    return auditionsByContest;
  });
};

exports.totalLikes = function(auditions) {
  if(auditions.isEmpty()) {
    return Promise.resolve({});
  } 
  return Bookshelf.knex(UserLike.forge().tableName)
    .select('video_id')
    .count('id as votes')
    .whereIn('video_id', auditions.pluck('id'))
    .groupBy('video_id')
  .then(function(rows) {
    var votesByVideo = {};
    rows.forEach(function(row) {
      votesByVideo[row.video_id] = row.votes;
    });
    return votesByVideo;
  });
};

exports.totalComments = function(auditions) {
  if(auditions.isEmpty()) {
    return Promise.resolve({});
  } 
  return Bookshelf.knex(Comment.forge().tableName)
    .select('video_id')
    .count('id as comments')
    .whereIn('video_id', auditions.pluck('id'))
    .groupBy('video_id')
  .then(function(rows) {
    var commentsByVideo = {};
    rows.forEach(function(row) {
      commentsByVideo[row.video_id] = row.comments;
    });
    return commentsByVideo;
  });
};

exports.listWinners = function(contests) {
  return User.collection();
  // return Bookshelf.knex(Video.forge().tableName)
  //   .whereIn('contest_id', contests.pluck('id'))
  //   .where('place', '<=', '3')
  //   .orderBy('place', 'asc')
  // .then(function(rows) {
  //   var winnerAuditions = {};
  //   var allAuditions = Audition.collection();
  //   rows.forEach(function(row) {
  //     if(!winnerAuditions[row.contest_id]) {
  //       winnerAuditions[row.contest_id] = Audition.collection();
  //     }
  //     var audition = Audition.forge(row);
  //     winnerAuditions[row.contest_id].add(audition);
  //     allAuditions.add(audition);
  //   });
  //   return allAuditions.load(auditionRelated.withRelated).then(function() {
  //     return winnerAuditions;
  //   });
  // });
};