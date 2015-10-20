'use strict';

var userService      = require('../apis/userService'),
    contestService   = require('../apis/contestService'),
    constants        = require('../apis/internal/constants'),
    messages         = require('../apis/internal/messages'),
    logger           = require('../configs/logger'),
    settings         = require('../configs/settings'),
    isAuthenticated  = require('../utils/authorization').isAuthenticated,
    models           = require('../models'),
    User             = models.User,
    Contest          = models.Contest;

module.exports = function(router, app) {

  app.use('/contests', router);

};