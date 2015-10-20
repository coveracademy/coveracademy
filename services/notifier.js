'use strict';

var userService = require('../apis/userService'),
    settings    = require('../configs/settings'),
    logger      = require('../configs/logger'),
    _           = require('lodash'),
    restify     = require('restify'),
    Promise     = require('bluebird'),
    io          = require('socket.io')(settings.notifier.ioPort),
    $           = this;

var server = restify.createServer({
  name: 'Notifier'
});

server.use(restify.queryParser());
server.use(restify.bodyParser());

var circles = io.of('/circles');
var socketIdByUser = {};

var isCircleRoom = function(room) {
  return _.startsWith(room, 'circle:');
};

var getCircleRoom = function(circleId) {
  return 'circle:' + circleId;
};

var getSocketByUser = function(userId) {
  var socketId = socketIdByUser[userId];
  if(socketId && $.connectedSockets('circles')[socketId]) {
    return $.connectedSockets('circles')[socketId];
  } else {
    return null;
  }
};

exports.namespaces = function() {
  return io.sockets.server.nsps;
};

exports.namespace = function(name) {
  return io.sockets.server.nsps['/' + name];
};

exports.room = function(namespace, name) {
  var namespace = $.namespace(namespace);
  if(namespace) {
    return namespace.adapter.rooms[name];
  } else {
    return null;
  }
};

exports.sockets = function(namespace) {
  var namespace = $.namespace(namespace);
  if(namespace) {
    return namespace.sockets;
  } else {
    return null;
  }
};

exports.connectedSockets = function(namespace) {
  var namespace = $.namespace(namespace);
  if(namespace) {
    return namespace.connected;
  } else {
    return null;
  }
};

exports.socketsInRoom = function(namespace, room) {
  var circleRoom = $.room('circles', room);
  var sockets = [];
  var connectedSockets = $.connectedSockets(namespace);
  _.keys(circleRoom).forEach(function(socketId) {
    var socket = connectedSockets[socketId];
    if(socket) {
      sockets.push(socket);
    }
  });
  return sockets;
};

exports.notifyCircleRemoved = function(circle, user) {
  return new Promise(function(resolve, reject) {
    var room = getCircleRoom(circle.id);
    if(room) {
      logger.debug('Notifying room %s that circle %d was removed', room, circle.id);
      circles.to(room).emit('circle_removed', {user: user, circle: circle});
      var sockets = $.socketsInRoom('circles', room);
      sockets.forEach(function(socket) {
        socket.leave(room);
      });
    }
    resolve();
  });
};

exports.notifyChatMessage = function(chatMessage) {
  return new Promise(function(resolve, reject) {
    var socket = getSocketByUser(chatMessage.user_id);
    if(socket) {
      var room = getCircleRoom(chatMessage.circle_id);
      logger.debug('Notifying chat message %j in room %s', chatMessage, room);
      socket.broadcast.to(room).emit('chat_message', chatMessage);
    }
    resolve();
  });
};

exports.notifyInvitation = function(invitation) {
  return new Promise(function(resolve, reject) {
    var socket = getSocketByUser(invitation.guest_id);
    if(socket) {
      logger.debug('Notifying invitation %j to socket %d', invitation, invitation.guest_id);
      socket.emit('invitation', invitation);
    }
    resolve();
  });
};

exports.notifyPosition = function(position) {
  return new Promise(function(resolve, reject) {
    var socket = getSocketByUser(position.id);
    if(socket) {
      socket.rooms.forEach(function(room) {
        if(isCircleRoom(room)) {
          logger.debug('Notifying position %j in room %s', position, room);
          socket.broadcast.to(room).emit('position', position);
        }
      });
    }
    resolve();
  });
};

exports.notifyActivity = function(activity) {
  return new Promise(function(resolve, reject) {
    var room = getCircleRoom(activity.circle_id);
    logger.debug('Notifying activity %j in room %s', activity, room);

    if(activity.type === 'circle_created' || activity.type === 'new_member') {
      var socket = getSocketByUser(activity.user_id);
      if(socket) {
        logger.debug('Activity of "circle_created" or "new_member" - Joining socket of user %d in room %s', activity.user_id, room);
        socket.join(room);
      }
    }

    circles.to(room).emit('activity', activity);

    if(activity.type === 'member_left' || activity.type === 'member_removed') {
      var socket = getSocketByUser(activity.user_id);
      if(socket) {
        logger.debug('Activity of "member_left" or "member_removed" - Removing socket of user %d from the room %s', activity.user_id, room);
        socket.leave(room);
      }
    }
    resolve();
  });
};

circles.on('connection', function(socket) {
  var userId = socket.request._query.user;
  logger.debug('Connecting user %d', userId);
  userService.getUser(userId, ['members']).then(function(user) {
    if(user) {
      socketIdByUser[user.id] = socket.id;
      var members = user.related('members');
      members.forEach(function(member) {
        var room = getCircleRoom(member.get('circle_id'));
        socket.join(room);
      });

      socket.emit('connected');
      logger.debug('User %d connected', user.id);
      userService.setOnline(user).catch(function(err) {
        logger.error('Error marking user %d online', user.id, err);
      });

      socket.on('disconnect', function() {
        delete socketIdByUser[user.id];
        userService.setOffline(user).catch(function(err) {
          logger.error('Error marking user %d offline', user.id, err);
        });
        logger.debug('User %d disconnected', user.id);
      });
    } else {
      logger.error('User %d does not exist', userId);
    }
  }).catch(function(err) {
    logger.error('Error finding user %d', userId, err);
  });
});

server.post('/notify/invitation', function(req, res, next) {
  $.notifyInvitation(req.body).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error notifying invitation %j', req.body, err);
    res.send(500);
  });
});

server.post('/notify/position', function(req, res, next) {
  $.notifyPosition(req.body).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error notifying user position %j', req.body, err);
    res.send(500);
  });
});

server.post('/notify/activity', function(req, res, next) {
  $.notifyActivity(req.body).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error notifying activity %j', req.body, err);
    res.send(500);
  });
});

server.post('/notify/chatMessage', function(req, res, next) {
  $.notifyChatMessage(req.body).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error notifying chat message %j', req.body, err);
    res.send(500);
  });
});

server.post('/notify/circleRemoved', function(req, res, next) {
  $.notifyCircleRemoved(req.body.circle, req.body.user).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error notifying that circle %j was removed', req.body.circle, err);
    res.send(500);
  });
});

server.listen(settings.notifier.port, function() {
  logger.info('%s listening at %s', server.name, server.url);
  logger.info('Socket.IO running on port %d', settings.notifier.ioPort);
});