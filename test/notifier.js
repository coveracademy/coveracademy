'use strict';

var notifier       = require('../services/notifier'),
    settings       = require('../configs/settings'),
    models         = require('../models'),
    datasets       = require('./datasets'),
    circleFixtures = require('./datasets/circleService'),
    IOClient       = require('./utils/ioClient'),
    Promise        = require('bluebird'),
    _              = require('lodash'),
    assert         = require('chai').assert;

describe('notifier', function() {
  beforeEach(function() {
    return datasets.clean();
  });

  describe('#namespace:circles', function() {
    describe('#onConnection', function() {
      it('should connect and join an user in the circle room', function() {
        return datasets.load(circleFixtures.circleWithThreeUsers).bind({}).then(function() {
          this.firstIOClient = new IOClient(1);
          this.secondIOClient = new IOClient(2);
          this.thirdIOClient = new IOClient(3);
          return Promise.all([this.firstIOClient.onConnected(), this.secondIOClient.onConnected(), this.thirdIOClient.onConnected()]);
        }).then(function() {
          return Promise.delay(100);
        }).then(function() {
          assert.isTrue(this.firstIOClient.connected);
          assert.isTrue(this.secondIOClient.connected);
          assert.isTrue(this.thirdIOClient.connected);
          assert.strictEqual(notifier.sockets('circles').length, 3);
          assert.strictEqual(_.size(notifier.connectedSockets('circles')), 3);
          assert.strictEqual(_.size(notifier.room('circles', 'circle:1')), 3);
          this.firstIOClient.disconnect();
          this.secondIOClient.disconnect();
          this.thirdIOClient.disconnect();
        });
      });
    });
  });

  // TODO:
  //   #nofityPosition (It should notify all circle rooms of user)
  //   #notifyActivity (It should notify the circle room)
  //   #notifyActivity (It should join socket to room when activity type is new_member)
  //   #notifyActivity (It should remove socket from room when activity type is member_removed)
  //   #notifyInvitation (It should notify only the socket)
  //   #connect (It should mark user online)
  //   #disconnect (It should mark user offline)
});