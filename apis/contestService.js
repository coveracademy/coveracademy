'use strict';

var models          = require('../models'),
    settings        = require('../configs/settings'),
    logger          = require('../configs/logger'),
    pagination      = require('../utils/pagination'),
    userService     = require('./userService'),
    notifier        = require('./internals/notifier'),
    postman         = require('./internals/postman'),
    messages        = require('./internals/messages'),
    constants       = require('./internals/constants'),
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

exports.getContest = function(id) {
  return Contest.forge({id: id}).fetch();
};

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

var listAuditions = function(rankType, contest, page, pageSize) {
  return Audition.collection().query(function(qb) {
    qb.where('contest_id', contest.id);
    qb.where('approved', 1);
    if(page && pageSize) {
      qb.offset((page - 1) * pageSize);
      qb.limit(pageSize);
    }
    if(rankType === 'latest') {
      qb.orderBy('registration_date', 'desc');
    } else {
      qb.leftJoin('user_vote', function() {
        this.on('audition.id', 'user_vote.audition_id');
        this.andOn('user_vote.valid', 1);
      });
      qb.groupBy('audition.id');
      qb.orderBy(Bookshelf.knex.raw('sum(user_vote.voting_power)'), 'desc');
    }
  }).fetch(auditionRelated);
};

exports.latestAuditions = function(contest, page, pageSize) {
  return listAuditions('latest', contest, page, pageSize);
};

exports.bestAuditions = function(contest, page, pageSize) {
  return listAuditions('best', contest, page, pageSize);
};

exports.randomAuditions = function(contest, size) {
  return $.latestAuditions(contest).then(function(auditions) {
    if(!size || size > auditions.length) {
      size = auditions.length;
    }
    var randomAuditions = Audition.collection();
    _.shuffle(_.range(size)).forEach(function(index) {
      randomAuditions.add(auditions.at(index));
    });
    return randomAuditions;
  });
};

exports.listAuditionsInContests = function(contests) {
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
    qb.where('contest_id', contest.id);
    qb.where('place', '<=', '3');
    qb.orderBy('place', 'asc');
  }).fetch(auditionRelated);
};

exports.listWinnerAuditionsInContests = function(contests) {
  return Bookshelf.knex('audition')
    .whereIn('contest_id', contests.pluck('id'))
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

exports.getUserAudition = function(user, contest, related) {
  return new Promise(function(resolve, reject) {
    if(!user) {
      resolve();
    } else {
      resolve(Audition.forge({user_id: user.id, contest_id: contest.id}).fetch());
    }
  });
};

exports.totalAuditions = function(contest) {
  return Audition.where('contest_id', contest.id).where('approved', 1).count();
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

exports.listUserVotes = function(user, contest) {
  return new Promise(function(resolve, reject) {
    if(!user) {
      resolve(UserVote.collection());
    } else {
      var promise = UserVote.collection().query(function(qb) {
        qb.join('audition', 'user_vote.audition_id', 'audition.id');
        qb.where('audition.contest_id', contest.id);
        qb.where('user_vote.user_id', user.id);
        qb.orderBy('user_vote.registration_date', 'asc');
      }).fetch();
      resolve(promise);
    }
  });
};

exports.totalUserVotes = function(user, contest) {
  return new Promise(function(resolve, reject) {
    if(!user) {
      resolve(0);
    } else {
      Bookshelf.knex('user_vote')
      .count('user_vote.id as total_votes')
      .join('audition', 'user_vote.audition_id', 'audition.id')
      .where('user_vote.user_id', user.id)
      .where('audition.contest_id', contest.id)
      .then(function(countRows) {
        resolve(countRows[0].total_votes);
      }).catch(function(err) {
        reject(err);
      });
    }
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
  return Bookshelf.knex('user_vote')
    .select('contest.id')
    .count('user_vote.id as total_votes')
    .join('audition', 'user_vote.audition_id', 'audition.id')
    .join('contest', 'audition.contest_id', 'contest.id')
    .whereIn('contest.id', contests.pluck('id'))
    .groupBy('contest.id')
    .then(function(rows) {
      var totalVotes = {};
      rows.forEach(function(row) {
        totalVotes[row.id] = row.total_votes;
      });
      return totalVotes;
    });
};

exports.totalVotesByAudition = function(auditions) {
  return new Promise(function(resolve, reject) {
    if(auditions.isEmpty()) {
      resolve({});
    } else {
      Bookshelf.knex('user_vote')
      .select('audition_id')
      .count('id as votes')
      .whereIn('audition_id', auditions.pluck('id'))
      .where('valid', 1)
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