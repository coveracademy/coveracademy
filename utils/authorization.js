'use strict';

exports.isAuthenticated = function(req, res, next) {
  if(req.session.user) {
    next();
  } else {
    res.send(401);
  }
};