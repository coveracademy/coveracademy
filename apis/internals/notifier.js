'use strict';

var settings       = require('../../configs/settings'),
    restify        = require('restify'),
    Promise        = require('bluebird'),
    notifierClient = restify.createJsonClient('http://' + settings.notifier.host + ':' + settings.notifier.port);

exports.notifyInvitation = function(invitation) {
  return new Promise(function(resolve, reject) {
    notifierClient.post('/notify/invitation', invitation.toJSON(), function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.notifyPosition = function(userPositions) {
  return new Promise(function(resolve, reject) {
    notifierClient.post('/notify/position', userPositions, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.notifyActivity = function(activity) {
  return new Promise(function(resolve, reject) {
    notifierClient.post('/notify/activity', activity.toJSON(), function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.notifyChatMessage = function(chatMessage) {
  return new Promise(function(resolve, reject) {
    notifierClient.post('/notify/chatMessage', chatMessage.toJSON(), function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
};

exports.notifyCircleRemoved = function(circle, user) {
  return new Promise(function(resolve, reject) {
    notifierClient.post('/notify/circleRemoved', {circle: circle.toJSON(), user: user.toJSON()}, function(err, req, res, obj) {
      if(err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
}