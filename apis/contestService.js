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
    Contest         = models.Contest,
    Audition        = models.Audition,
    Bookshelf       = models.Bookshelf,
    $               = this;

exports.listRunningContests = function() {
  return Contest.collection().query(function(qb) {
    qb.where('progress', 'running');
    qb.where('active', 1);
    qb.orderBy('registration_date', 'desc');
  }).fetch();
};

exports.listAuditions = function(contests) {
  return Audition.collection().query(function(qb) {
    qb.whereIn('contest_id', contests.pluck('id'));
  }).fetch();
};