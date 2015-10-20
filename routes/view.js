'use strict';

var contestService  = require('../apis/contestService'),
    userService     = require('../apis/userService'),
    messages        = require('../apis/internal/messages'),
    logger          = require('../configs/logger'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    models          = require('../models'),
    Promise         = require('bluebird'),
    Contest         = models.Contest,
    User            = models.User;

module.exports = function(router, app) {

  app.use('/views', router);

};