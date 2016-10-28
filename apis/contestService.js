'use strict';

var models        = require('../models'),
    messages      = require('./internals/messages'),
    constants     = require('./internals/constants'),
    Promise       = require('bluebird'),
    _             = require('lodash'),
    Bookshelf     = models.Bookshelf,
    Comment       = models.Comment,
    Contest       = models.Contest,
    ContestWinner = models.ContestWinner,
    User          = models.User,
    UserLike      = models.UserLike,
    Video         = models.Video,
    $             = this;

var contestWinnerWithUserRelated = {withRelated: ['user']};
var videoWithUserRelated = {withRelated: ['user']};

exports.getContest = function(id) {
  return Contest.forge({id: id}).fetch();
};

exports.listRunningContests = function() {
  return Contest.collection().query(function(qb) {
    var now = new Date();
    qb.where('start_date', '<', now);
    qb.where('end_date', '>', now);
    qb.orderBy('start_date', 'asc');
  }).fetch();
};

exports.listLatestContests = function(page, pageSize) {
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

exports.listRandomAuditions = function(contests, related) {
  return Video.query('whereIn', 'contest_id', contests.pluck('id')).fetchAll({withRelated: related}).then(function(videos) {
    return Video.collection(videos.shuffle());
  });
};

exports.listAuditions = function(contest) {
  return Promise.resolve().then(function() {
    var rankType;
    if(contest.get('progress') === constants.CONTEST_WAITING) {
      rankType = constants.RANK_LATEST;
    } else if(contest.get('progress') == constants.CONTEST_FINISHED) {
      rankType = constants.RANK_BEST;
    } else {
      rankType = constants.RANK_RANDOM;
    }
    return Video.collection().query(function(qb) {
      qb.where('contest_id', contest.id);
      if(rankType === constants.RANK_LATEST) {
        qb.orderBy('registration_date', 'desc');
      } else if(rankType === constants.RANK_BEST) {
        qb.leftJoin(UserLike.forge().tableName, function() {
          this.on('video.id', 'user_like.video_id');
        });
        qb.groupBy('video.id');
      }
    }).fetch(videoWithUserRelated).then(function(auditions) {
      if(rankType === constants.RANK_LATEST) {
        return Video.collection(auditions.shuffle());
      } else {
        return auditions;
      }
    });
  });
};

exports.listWinnersInContests = function(contests) {
  return ContestWinner.query(function(qb) {
    qb.whereIn('contest_id', contests.pluck('id'));
    qb.orderBy('contest_id', 'asc');
    qb.orderBy('place', 'asc');
  }).fetchAll(contestWinnerWithUserRelated).then(function(contestWinners) {
    var winnersByContest = {};
    contestWinners.forEach(function(contestWinner) {
      var winners = winnersByContest[contestWinner.get('contest_id')] || User.collection();
      if(winners.isEmpty()) {
        winnersByContest[contestWinner.get('contest_id')] = winners;
      }
      winners.add(contestWinner.related('user'));
    });
    return winnersByContest;
  });
};

exports.listWinners = function(contest) {
  return $.listWinnersInContests(Contest.collection().add(contest)).then(function(winners) {
    return winners[contest.id];
  });
};

exports.totalAuditionsInContests = function(contests) {
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

exports.totalAuditions = function(contest) {
  return $.totalAuditionsInContests(Contest.collection().add(contest)).then(function(totalAuditions) {
    return totalAuditions[contest.id];
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