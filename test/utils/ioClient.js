'use strict';

var settings = require('../../configs/settings'),
    Promise  = require('bluebird');

var circlesSocketUrl = 'http://localhost:' + settings.notifier.ioPort + '/circles';

var IOClient = function(userId) {
  var client = require('socket.io-client')(circlesSocketUrl, {query: 'user=' + userId, forceNew: true});
  var that = this;
  this.userId = userId;
  this.connected = false;
  this.notified = false;
  this.activity = null;
  client.on('connect', function() {
    client.on('connected', function() {
      that.connected = true;
    });
    client.on('disconnect', function() {
      that.connected = false;
    });
    client.on('activity', function(activity) {
      that.notified = true;
      that.activity = activity;
    });
  });
  this.onConnected = function() {
    return new Promise(function(resolve, reject) {
      var onConnectedInterval = setInterval(function() {
        if(that.connected === true) {
          clearInterval(onConnectedInterval);
          resolve();
        }
      }, 100);
    });
  };
  this.onActivity = function() {
    return new Promise(function(resolve, reject) {
      var onActivityInterval = setInterval(function() {
        if(that.notified === true) {
          clearInterval(onActivityInterval);
          resolve();
        }
      }, 100);
    });
  };
  this.disconnect = function() {
    client.disconnect();
  };
};

module.exports = IOClient