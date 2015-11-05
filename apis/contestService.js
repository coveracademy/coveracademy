'use strict';

var models          = require('../models'),
    settings        = require('../configs/settings'),
    logger          = require('../configs/logger'),
    pagination      = require('../utils/pagination'),
    entities        = require('../utils/entities'),
    userService     = require('./userService'),
    notifier        = require('./internal/notifier'),
    postman         = require('./internal/postman'),
    messages        = require('./internal/messages'),
    constants       = require('./internal/constants'),
    shortid         = require('shortid'),
    Promise         = require('bluebird'),
    moment          = require('moment').utc,
    _               = require('lodash'),
    ValidationError = require('bookshelf-filteration').ValidationError,
    User            = models.User,
    UserVote        = models.UserVote,
    UserComment     = models.UserComment,
    Contest         = models.Contest,
    Audition        = models.Audition,
    Bookshelf       = models.Bookshelf,
    $               = this;

var auditionRelated = {withRelated: ['user']};
var auditionWithContestRelated = {withRelated: ['contest']};

exports.listRunningContests = function() {
  return Contest.collection().query(function(qb) {
    qb.where('progress', 'running');
    qb.where('active', 1);
    qb.orderBy('registration_date', 'desc');
  }).fetch();
};

exports.latestContests = function(page, pageSize) {
  return Contest.collection().query(function(qb) {
    qb.where('active', 1);
    qb.orderBy('registration_date', 'desc');
    if(page && pageSize) {
      qb.offset((page - 1) * pageSize);
      qb.limit(pageSize);
    }
  }).fetch();
};

exports.listAuditions = function(contests) {
  return Audition.collection().query(function(qb) {
    qb.whereIn('contest_id', contests.pluck('id'));
  }).fetch();
};

exports.listUserAuditions = function(user) {
  return Audition.collection().query(function(qb) {
    qb.where('user_id', user.id);
    qb.where('approved', 1);
    qb.orderBy('registration_date', 'desc');
  }).fetch(auditionWithContestRelated);
};

exports.listWinnerAuditions = function(contest) {
  return Audition.collection().query(function(qb) {
    qb.where('contest_id', obj.id);
    qb.where('place', '<=', '3');
    qb.orderBy('place', 'asc');
  }).fetch(auditionRelated);
};

exports.listWinnerAuditionsInContests = function(contests) {
  return  Bookshelf.knex('audition')
    .whereIn('contest_id', entities.getIds(obj))
    .where('place', '<=', '3')
    .orderBy('place', 'asc')
    .then(function(rows) {
      var winnerAuditions = {};
      var allAuditions = Audition.collection();
      rows.forEach(function(row) {
        if(!winnerAuditions[row.contest_id]) {
          winnerAuditions[row.contest_id] = Audition.collection();
        }
        var audition = Audition.forge(row);
        winnerAuditions[row.contest_id].add(audition);
        allAuditions.add(audition);
      });
      return allAuditions.load(auditionRelated.withRelated).then(function() {
        return winnerAuditions;
      });
    });
};

exports.totalAuditions = function(obj) {
  return Audition.where('contest_id', obj.id).where('approved', 1).count();
};

exports.totalAuditionsInContests = function(contests) {
  return Bookshelf.knex('audition')
    .select('contest_id')
    .count('id as total_auditions')
    .whereIn('contest_id', contests.pluck('id'))
    .where('approved', 1)
    .groupBy('contest_id')
    .then(function(rows) {
      var totalAuditions = {};
      rows.forEach(function(row) {
        totalAuditions[row.contest_id] = row.total_auditions;
      });
      return totalAuditions;
    });
};

exports.totalVotes = function(auditions) {
  return new Promise(function(resolve, reject) {
    if(auditions.isEmpty()) {
      resolve({});
    } else {
      Bookshelf.knex(UserVote.forge().tableName)
      .select('audition_id')
      .count('id as votes')
      .whereIn('audition_id', auditions.pluck('id'))
      .groupBy('audition_id')
      .then(function(votesCounts) {
        var votesByAudition = {};
        votesCounts.forEach(function(votesCount) {
          votesByAudition[votesCount.audition_id] = votesCount.votes;
        });
        resolve(votesByAudition);
      }).catch(function(err) {
        reject(err);
      });
    }
  });
};

exports.totalVotesInContests = function(contests) {
  return new Promise(function(resolve, reject) {
    var qb = Bookshelf.knex('user_vote')
    .select('contest.id')
    .count('user_vote.id as total_votes')
    .join('audition', 'user_vote.audition_id', 'audition.id')
    .join('contest', 'audition.contest_id', 'contest.id')
    .whereIn('contest.id', entities.getIds(contests))
    .groupBy('contest.id')
    .then(function(rows) {
      var totalVotes = {};
      rows.forEach(function(row) {
        totalVotes[row.id] = row.total_votes;
      });
      resolve(totalVotes);
    }).catch(function(err) {
      reject(err);
    });
  });
};

exports.totalComments = function(auditions) {
  return new Promise(function(resolve, reject) {
    if(auditions.isEmpty()) {
      resolve({});
    } else {
      Bookshelf.knex(UserComment.forge().tableName)
      .select('audition_id')
      .count('id as comments')
      .whereIn('audition_id', auditions.pluck('id'))
      .groupBy('audition_id')
      .then(function(commentsCounts) {
        var votesByAudition = {};
        commentsCounts.forEach(function(commentsCount) {
          votesByAudition[commentsCount.audition_id] = commentsCount.comments;
        });
        resolve(votesByAudition);
      }).catch(function(err) {
        reject(err);
      });
    }
  });
};