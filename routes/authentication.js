'use strict';

var userService = require('../apis/userService'),
    messages    = require('../apis/internals/messages'),
    logger      = require('../configs/logger'),
    passport    = require('passport');

module.exports = function(router, app) {

  router.get('/facebook', passport.authenticate('facebook-token'), function(req, res) {
  	res.json(req.user);
  });

  app.use('/users/auth', router);

};