'use strict';

var models         = require('../../models'),
    settings       = require('../../configs/settings'),
    logger         = require('../../configs/logger'),
    messages       = require('../../apis/internals/messages'),
    Promise        = require('bluebird'),
    restify        = require('restify'),
    Bookshelf      = models.Bookshelf,
    postman        = restify.createJsonClient('http://' + settings.postman.host + ':' + settings.postman.port),
    $              = this;

exports.receive = function(fromName, from, subject, text) {
  return new Promise(function(resolve, reject) {
    postman.post('/receive', {fromName: fromName, from: from, subject: subject, text: text}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.send = function(to, subject, text) {
  return new Promise(function(resolve, reject) {
    postman.post('/send', {to: to, subject: subject, text: text}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.userRegistration = function(user) {
  return new Promise(function(resolve, reject) {
    postman.post('/user/registration', {user: user.id}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};