'use strict';

var models         = require('../../models'),
    settings       = require('../../configs/settings'),
    logger         = require('../../configs/logger'),
    messages       = require('../../apis/internal/messages'),
    Promise        = require('bluebird'),
    restify        = require('restify'),
    ScheduledEmail = models.ScheduledEmail,
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

exports.userVerification = function(user, verificationToken, registration) {
  return new Promise(function(resolve, reject) {
    postman.post('/user/verification', {user: user.id, token: verificationToken.get('token'), registration: registration}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.inviteContact = function(invitation) {
  return new Promise(function(resolve, reject) {
    postman.post('/contacts/invite', {invitation: invitation.id}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.resetPasswordRequest = function(user) {
  return new Promise(function(resolve, reject) {
    postman.post('/password/resetRequest', {user: user.id}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.verifyEmailRequest = function(user) {
  return new Promise(function(resolve, reject) {
    postman.post('/email/verifyRequest', {user: user.id}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};