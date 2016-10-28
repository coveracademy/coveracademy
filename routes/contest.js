'use strict';

var contestService  = require('../apis/videoService'),
    messages        = require('../apis/internals/messages'),
    logger          = require('../configs/logger'),
    isAuthenticated = require('../utils/authorization').isAuthenticated,
    models          = require('../models');

module.exports = function(router, app) {

  app.use('/contests', router);

};