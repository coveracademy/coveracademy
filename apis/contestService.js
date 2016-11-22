'use strict';

var models    = require('../models'),
    messages  = require('./internals/messages'),
    constants = require('./internals/constants'),
    Promise   = require('bluebird'),
    _         = require('lodash'),
    Bookshelf = models.Bookshelf,
    Contest   = models.Contest,
    Winner    = models.Winner,
    User      = models.User,
    Like      = models.Like,
    Video     = models.Video,
    $         = this;

var contestWinnerWithUserRelated = {withRelated: ['user']};
var videoWithUserRelated = {withRelated: ['user']};

exports.getContest = function(id) {
  return Contest.forge({id: id}).fetch();
};

exports.listRunningContests = function() {
  return Contest.query(function(qb) {
    var now = new Date();
    qb.where('start_date', '<', now);
    qb.where('end_date', '>', now);
    qb.orderBy('start_date', 'asc');
  }).fetchAll();
};

exports.listAvailableContests = function() {
  return Contest.query(function(qb) {
    var now = new Date();
    qb.whereNull('start_date');
    qb.orWhereNull('end_date');
    qb.orWhere('start_date', '>', now);
    qb.orWhere(function() {
      this.where('start_date', '<', now);
      this.where('end_date', '>', now);
    });
    qb.orderBy('start_date', 'asc');
  }).fetchAll();
};

exports.listAvailableContestsToUser = function(user) {
  return $.listAvailableContests().then(function(contests) {
    return Video.query(function(qb) {
      qb.where('user_id', user.id);
      qb.whereIn('contest_id', contests.pluck('id'));
    }).fetchAll().then(function(videos) {
      videos.forEach(function(video) {
        contests.remove(contests.get(video.get('contest_id')));
      });
      return contests;
    });
  });
};

exports.listLatestContests = function(page, pageSize) {
  return Contest.query(function(qb) {
    qb.whereNotNull('start_date');
    qb.whereNotNull('end_date');
    qb.orderBy('start_date', 'desc');
    if(page && pageSize) {
      qb.offset((page - 1) * pageSize);
      qb.limit(pageSize);
    }
  }).fetchAll();
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
    return Video.query(function(qb) {
      qb.where('contest_id', contest.id);
      if(rankType === constants.RANK_LATEST) {
        qb.orderBy('registration_date', 'desc');
      } else if(rankType === constants.RANK_BEST) {
        qb.leftJoin(Like.forge().tableName, function() {
          this.on('video.id', 'user_like.video_id');
        });
        qb.groupBy('video.id');
      }
    }).fetchAll(videoWithUserRelated).then(function(videos) {
      if(rankType === constants.RANK_LATEST) {
        return Video.collection(videos.shuffle());
      } else {
        return videos;
      }
    });
  });
};

exports.listWinnersInContests = function(contests) {
  return Winner.query(function(qb) {
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
    .count('id as videos')
    .whereIn('contest_id', contests.pluck('id'))
    .groupBy('contest_id')
  .then(function(rows) {
    var videosByContest = {};
    rows.forEach(function(row) {
      videosByContest[row.contest_id] = row.videos;
    });
    return videosByContest;
  });
};

exports.totalAuditions = function(contest) {
  return $.totalAuditionsInContests(Contest.collection().add(contest)).then(function(totalVideos) {
    return totalVideos[contest.id];
  });
};