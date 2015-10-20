'use strict';

var circleService  = require('../apis/circleService'),
    notifier       = require('../services/notifier'),
    settings       = require('../configs/settings'),
    models         = require('../models'),
    datasets       = require('./datasets'),
    circleFixtures = require('./datasets/circleService'),
    IOClient       = require('./utils/ioClient'),
    Promise        = require('bluebird'),
    assert         = require('chai').assert;

describe('activities', function() {
  beforeEach(function() {
    return datasets.clean();
  });

  describe('#createNotifications', function() {
    it('should notify all users in the circle about the activity', function() {
      return datasets.load(circleFixtures.circleWithThreeUsers).bind({}).then(function() {
        this.firstIOClient = new IOClient(1);
        this.secondIOClient = new IOClient(2);
        this.thirdIOClient = new IOClient(3);
        return Promise.all([this.firstIOClient.onConnected(), this.secondIOClient.onConnected(), this.thirdIOClient.onConnected()]);
      }).then(function() {
        var circle = models.Circle.forge({id: 1});
        var user = models.User.forge({id: 1});
        var place = models.Place.forge({name: 'Home', latitude: -12.973325, longitude: -38.481951, radius: 250, type: 'place'});
        return circleService.createPlace(circle, user, place);
      }).then(function(place) {
        return Promise.all([this.firstIOClient.onActivity(), this.secondIOClient.onActivity(), this.thirdIOClient.onActivity()]);
      }).then(function() {
        assert.isTrue(this.firstIOClient.connected);
        assert.isTrue(this.firstIOClient.notified);
        delete this.firstIOClient.activity['occurrence_date'];
        assert.deepEqual(this.firstIOClient.activity, {id: 1, circle_id: 1, place_id: 1, user_id: 1, type: 'place_created', particular: 0})
        this.firstIOClient.disconnect();

        assert.isTrue(this.secondIOClient.connected);
        assert.isTrue(this.secondIOClient.notified);
        delete this.secondIOClient.activity['occurrence_date'];
        assert.deepEqual(this.secondIOClient.activity, {id: 1, circle_id: 1, place_id: 1, user_id: 1, type: 'place_created', particular: 0})
        this.secondIOClient.disconnect();

        assert.isTrue(this.thirdIOClient.connected);
        assert.isTrue(this.thirdIOClient.notified);
        delete this.thirdIOClient.activity['occurrence_date'];
        assert.deepEqual(this.thirdIOClient.activity, {id: 1, circle_id: 1, place_id: 1, user_id: 1, type: 'place_created', particular: 0})
        this.thirdIOClient.disconnect();
      });
    });
  });
});