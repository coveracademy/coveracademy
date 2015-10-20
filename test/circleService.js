'use strict';

var circleService  = require('../apis/circleService'),
    userService    = require('../apis/userService'),
    constants      = require('../apis/internal/constants'),
    messages       = require('../apis/internal/messages'),
    cryptography   = require('../utils/cryptography'),
    models         = require('../models'),
    datasets       = require('./datasets'),
    fixtures       = require('./datasets/circleService'),
    Promise        = require('bluebird'),
    moment         = require('moment').utc,
    assert         = require('chai').assert;

describe('circleService', function() {
  beforeEach(function() {
    return datasets.clean();
  });

  describe('#createCircle', function() {
    it('should create a circle', function() {
      return datasets.load(fixtures.oneUser).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        return circleService.createCircle(user, 'Family');
      }).then(function(circle) {
        return models.Circle.forge({id: circle.id}).fetch();
      }).then(function(circle) {
        assert.strictEqual(circle.get('creator_id'), 1);
        assert.strictEqual(circle.get('name'), 'Family');
        assert.strictEqual(circle.get('location_mode'), 'anytime');
        assert.isNull(circle.get('avatar'));
        return models.Circle.forge({id: circle.id}).fetch({withRelated: ['users', 'members']});
      }).then(function(circle) {
        this.circle = circle;
        var users = circle.related('users');
        assert.strictEqual(users.length, 1);
        var user = users.at(0);
        assert.strictEqual(user.id, 1);
        assert.strictEqual(user.get('first_name'), 'Sandro');
        var members = circle.related('members');
        assert.strictEqual(members.length, 1);
        var association = members.at(0);
        assert.strictEqual(association.get('user_id'), 1);
        assert.strictEqual(association.get('circle_id'), circle.id);
        assert.strictEqual(association.get('location_mode'), circle.get('location_mode'));
        assert.strictEqual(association.get('permission'), constants.circlePermissions.OWNER);
      });
    });

    it('should create a circle with avatar', function() {
      return datasets.load(fixtures.oneUser).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        return circleService.createCircle(user, 'Family', '1_20160704140710.jpg');
      }).then(function(circle) {
        return models.Circle.forge({id: circle.id}).fetch();
      }).then(function(circle) {
        assert.strictEqual(circle.get('1_20160704140710.jpg'));
      });
    });

    it('should create the user activity "circle_created" when creates a circle', function() {
      return datasets.load(fixtures.oneUser).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        return circleService.createCircle(user, 'Family');
      }).then(function(circle) {
        return models.Circle.forge({id: circle.id}).fetch();
      }).then(function(circle) {
        this.circle = circle;
        return Promise.delay(200);
      }).then(function() {
        return models.UserActivity.forge({circle_id: this.circle.id}).fetch();
      }).then(function(userActivity) {
        assert.strictEqual(userActivity.get('circle_id'), this.circle.id);

        var ocurrenceDate = moment(userActivity.get('occurrence_date')).millisecond(0).second(0).toDate().getTime();
        var registrationDate = moment(this.circle.get('registration_date')).millisecond(0).second(0).toDate().getTime();
        assert.strictEqual(ocurrenceDate, registrationDate);

        assert.strictEqual(userActivity.get('user_id'), 1);
        assert.strictEqual(userActivity.get('particular'), 0);
        assert.strictEqual(userActivity.get('type'), 'circle_created');
        assert.isNull(userActivity.get('parameters'));
        return models.UserNotification.collection().fetch();
      }).then(function(notifications) {
        assert.strictEqual(notifications.length, 0);
      });
    });
  });

  describe('#removeCircle', function() {
    it('should remove a circle', function() {
      return datasets.load(fixtures.circleToRemove).then(function() {
        var user = models.User.forge({id: 1});
        var circle = models.Circle.forge({id: 1});
        return circleService.removeCircle(circle, user);
      }).then(function(circle) {
        var promises = [];
        promises.push(models.Circle.fetchAll());
        promises.push(models.Member.fetchAll());
        promises.push(models.Place.fetchAll());
        promises.push(models.Invitation.fetchAll());
        promises.push(models.GuestInformation.fetchAll());
        promises.push(models.UserActivity.fetchAll());
        promises.push(models.UserNotification.fetchAll());
        return Promise.all(promises);
      }).spread(function(circles, members, places, invitations, guestInformations, activities, notifications) {
        assert.isTrue(circles.isEmpty());
        assert.isTrue(members.isEmpty());
        assert.isTrue(places.isEmpty());
        assert.isTrue(invitations.isEmpty());
        assert.isTrue(guestInformations.isEmpty());
        assert.isTrue(activities.isEmpty());
        assert.isTrue(notifications.isEmpty());
      });
    });

    it('should not remove a circle when user is admin', function() {
      return datasets.load(fixtures.circleToRemove).then(function() {
        var user = models.User.forge({id: 2});
        var circle = models.Circle.forge({id: 1});
        return circleService.removeCircle(circle, user);
      }).catch(function(err) {
        assert.strictEqual(err.key, 'circle.remove.noPermission');
      });
    });

    it('should not remove a circle when user is neither owner nor admin', function() {
      return datasets.load(fixtures.circleToRemove).then(function() {
        var user = models.User.forge({id: 3});
        var circle = models.Circle.forge({id: 1});
        return circleService.removeCircle(circle, user);
      }).catch(function(err) {
        assert.strictEqual(err.key, 'circle.remove.noPermission');
      });
    });
  });

  describe('#updateCircle', function() {
    it('should update a circle', function() {
      return datasets.load(fixtures.circleWithOneUser).then(function() {
        var user = models.User.forge({id: 1});
        var circle = models.Circle.forge({id: 1, name: 'Big family', avatar: 'big_family.jpg', location_mode: 'places_only'});
        return circleService.updateCircle(circle, user);
      }).then(function(circle) {
        return circle.fetch();
      }).then(function(circle) {
        assert.strictEqual(circle.get('name'), 'Big family');
        assert.strictEqual(circle.get('avatar'), 'big_family.jpg');
        assert.strictEqual(circle.get('location_mode'), 'places_only');
      });
    });

    it('should not update when attribute is not editable', function() {
      var user = models.User.forge({id: 1});
      var circle = models.Circle.forge({id: 1});
      var circleWithCreator = models.Circle.forge({id: 1, creator_id: 10});
      return datasets.load(fixtures.circleWithOneUser).then(function() {
        return circleService.updateCircle(user, circleWithCreator);
      }).then(function(circle) {
        assert.fail('It should throw error because was passed attributes that are not editables');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'circle.update.nothingToSave');
        return circle.fetch();
      }).then(function(circle) {
        assert.strictEqual(circle.get('creator_id'), 1);
      });
    });

    it('should not update a circle when user has no permission', function() {
      return datasets.load(fixtures.circleWithTwoUsers).then(function() {
        var user = models.User.forge({id: 2});
        var circle = models.Circle.forge({id: 1, name: 'Brothers'});
        return circleService.updateCircle(circle, user);
      }).then(function(place) {
        assert.fail('It should not update a circle because user has no permission');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'circle.update.noPermission');
      });
    });

    it('should create the user activity "circle_updated" when updates a circle', function() {
      var now = moment().millisecond(0).toDate();
      return datasets.load(fixtures.onePlace).bind({}).then(function() {
        var user = models.User.forge({id: 2});
        var circle = models.Circle.forge({id: 1, name: 'Sweet Family'});
        return circleService.updateCircle(circle, user);
      }).then(function(circle) {
        return models.Circle.forge({id: circle.id}).fetch();
      }).then(function(circle) {
        this.circle = circle;
        return Promise.delay(200);
      }).then(function() {
        return models.UserActivity.forge({circle_id: this.circle.id}).fetch();
      }).then(function(userActivity) {
        this.userActivity = userActivity;
        assert.strictEqual(userActivity.get('circle_id'), this.circle.id);
        assert.strictEqual(userActivity.get('user_id'), 2);
        assert.strictEqual(userActivity.get('particular'), 0);
        assert.strictEqual(userActivity.get('type'), 'circle_updated');
        assert.isTrue(userActivity.get('occurrence_date').getTime() === now.getTime() || userActivity.get('occurrence_date').getTime() > now.getTime());
        assert.isNull(userActivity.get('parameters'));
        return models.UserNotification.collection().fetch({withRelated: ['activity']});
      }).then(function(notifications) {
        assert.strictEqual(notifications.length, 2);
        var notification = notifications.at(0);
        assert.strictEqual(notification.related('activity').get('user_id'), 2);
        assert.strictEqual(notification.get('related_id'), 1);
        assert.strictEqual(notification.get('activity_id'), this.userActivity.id);
        assert.strictEqual(notification.get('viewed'), 0);
        var otherNotification = notifications.at(1);
        assert.strictEqual(otherNotification.related('activity').get('user_id'), 2);
        assert.strictEqual(otherNotification.get('related_id'), 3);
        assert.strictEqual(otherNotification.get('activity_id'), this.userActivity.id);
        assert.strictEqual(otherNotification.get('viewed'), 0);
      });
    });
  });

  describe('#createPlace', function() {
    it('should create a place', function() {
      var circle = models.Circle.forge({id: 1});
      return datasets.load(fixtures.circleWithOneUser).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        var place = models.Place.forge({name: 'Home', latitude: -12.973325, longitude: -38.481951, radius: 250, type: 'place'});
        return circleService.createPlace(circle, user, place);
      }).then(function(place) {
        return models.Place.forge({id: place.id}).fetch();
      }).then(function(place) {
        assert.strictEqual(place.get('type'), 'place');
        assert.strictEqual(place.get('circle_id'), 1);
        assert.strictEqual(place.get('creator_id'), 1);
        assert.strictEqual(place.get('name'), 'Home');
        assert.strictEqual(place.get('latitude'), -12.973325);
        assert.strictEqual(place.get('longitude'), -38.481951);
        assert.strictEqual(place.get('radius'), 250);
      });
    });

    it('should create the user activity "place_created" and notifications when creates a place', function() {
      var circle = models.Circle.forge({id: 1});
      return datasets.load(fixtures.circleWithTwoUsers).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        var place = models.Place.forge({name: 'Home', latitude: -12.973325, longitude: -38.481951, radius: 250, type: 'place'});
        return circleService.createPlace(circle, user, place);
      }).then(function(place) {
        return models.Place.forge({id: place.id}).fetch();
      }).then(function(place) {
        this.place = place;
        return Promise.delay(200);
      }).then(function() {
        return models.UserActivity.forge({circle_id: circle.id}).fetch();
      }).then(function(userActivity) {
        this.userActivity = userActivity;
        assert.strictEqual(userActivity.get('circle_id'), circle.id);
        assert.strictEqual(userActivity.get('place_id'), this.place.id);
        assert.strictEqual(userActivity.get('user_id'), 1);
        assert.strictEqual(userActivity.get('particular'), 0);
        assert.strictEqual(userActivity.get('type'), 'place_created');
        assert.strictEqual(userActivity.get('occurrence_date').getTime(), this.place.get('registration_date').getTime());
        assert.isNull(userActivity.get('parameters'));
        return models.UserNotification.collection().fetch({withRelated: ['activity']});
      }).then(function(notifications) {
        assert.strictEqual(notifications.length, 1);
        var notification = notifications.at(0);
        assert.strictEqual(notification.related('activity').get('user_id'), 1);
        assert.strictEqual(notification.get('related_id'), 2);
        assert.strictEqual(notification.get('activity_id'), this.userActivity.id);
        assert.strictEqual(notification.get('viewed'), 0);
      });
    });

    it('should not create a place when user has no permission', function() {
      return datasets.load(fixtures.circleWithTwoUsers).then(function() {
        var user = models.User.forge({id: 2});
        var circle = models.Circle.forge({id: 1});
        var place = models.Place.forge({name: 'Home', latitude: -12.973325, longitude: -38.481951, radius: 250, type: 'place'});
        return circleService.createPlace(circle, user, place);
      }).then(function(place) {
        assert.fail('It should not create a place because user has no permission');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'place.create.noPermission');
      });
    });

    it('should create an event', function() {
      var circle = models.Circle.forge({id: 1});
      var startDate = moment({millisecond: 0}).add(1, 'day').toDate();
      var endDate = moment({millisecond: 0}).add(2, 'days').toDate();
      return datasets.load(fixtures.circleWithOneUser).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        var event = models.Place.forge({name: 'Home Party', latitude: -12.973325, longitude: -38.481951, radius: 300, type: 'event', recurring_event: 0, start_date: startDate, end_date: endDate});
        return circleService.createPlace(circle, user, event);
      }).then(function(event) {
        return models.Place.forge({id: event.id}).fetch();
      }).then(function(event) {
        assert.strictEqual(event.get('type'), 'event');
        assert.strictEqual(event.get('circle_id'), 1);
        assert.strictEqual(event.get('creator_id'), 1);
        assert.strictEqual(event.get('name'), 'Home Party');
        assert.strictEqual(event.get('latitude'), -12.973325);
        assert.strictEqual(event.get('longitude'), -38.481951);
        assert.strictEqual(event.get('radius'), 300);
        assert.strictEqual(event.get('start_date').getTime(), startDate.getTime());
        assert.strictEqual(event.get('end_date').getTime(), endDate.getTime());
      });
    });

    it('should create the user activity "place_created" and notifications when creates an event', function() {
      var circle = models.Circle.forge({id: 1});
      var startDate = moment({millisecond: 0}).add(1, 'day').toDate();
      var endDate = moment({millisecond: 0}).add(2, 'days').toDate();
      return datasets.load(fixtures.circleWithTwoUsers).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        var event = models.Place.forge({name: 'Home Party', latitude: -12.973325, longitude: -38.481951, radius: 300, type: 'event', recurring_event: 0, start_date: startDate, end_date: endDate});
        return circleService.createPlace(circle, user, event);
      }).then(function(event) {
        return models.Place.forge({id: event.id}).fetch();
      }).then(function(event) {
        this.event = event;
        return Promise.delay(200);
      }).then(function() {
        return models.UserActivity.forge({circle_id: circle.id}).fetch();
      }).then(function(userActivity) {
        this.userActivity = userActivity;
        assert.strictEqual(userActivity.get('circle_id'), circle.id);
        assert.strictEqual(userActivity.get('place_id'), this.event.id);
        assert.strictEqual(userActivity.get('user_id'), 1);
        assert.strictEqual(userActivity.get('particular'), 0);
        assert.strictEqual(userActivity.get('type'), 'place_created');
        assert.strictEqual(userActivity.get('occurrence_date').getTime(), this.event.get('registration_date').getTime());
        assert.isNull(userActivity.get('parameters'));
        return models.UserNotification.collection().fetch({withRelated: ['activity']});
      }).then(function(notifications) {
        assert.strictEqual(notifications.length, 1);
        var notification = notifications.at(0);
        assert.strictEqual(notification.related('activity').get('user_id'), 1);
        assert.strictEqual(notification.get('related_id'), 2);
        assert.strictEqual(notification.get('activity_id'), this.userActivity.id);
        assert.strictEqual(notification.get('viewed'), 0);
      });
    });

    it('should not create an event when user has no permission', function() {
      return datasets.load(fixtures.circleWithTwoUsers).then(function() {
        var user = models.User.forge({id: 2});
        var circle = models.Circle.forge({id: 1});
        var startDate = moment({millisecond: 0}).add(1, 'day').toDate();
        var endDate = moment({millisecond: 0}).add(2, 'days').toDate();
        var event = models.Place.forge({name: 'Home', latitude: -12.973325, longitude: -38.481951, radius: 250, type: 'event', recurring_event: 0, start_date: startDate, end_date: endDate});
        return circleService.createPlace(circle, user, event);
      }).then(function(event) {
        assert.fail('It should not create an event because user has no permission');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'place.create.noPermission');
      });
    });

    it('should not create an event when a date in the past is passed', function() {
      return datasets.load(fixtures.circleWithTwoUsers).then(function() {
        var user = models.User.forge({id: 1});
        var circle = models.Circle.forge({id: 1});
        var startDate = moment({millisecond: 0}).subtract(1, 'day').toDate();
        var endDate = moment({millisecond: 0}).add(2, 'days').toDate();
        var event = models.Place.forge({name: 'Home', latitude: -12.973325, longitude: -38.481951, radius: 250, type: 'event', recurring_event: 0, start_date: startDate, end_date: endDate});
        return circleService.createPlace(circle, user, event);
      }).then(function(event) {
        assert.fail('It should not create an event when a date in the past is passed');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'place.save.startDateMustBeInTheFuture');
      });
    });
  });

  describe('#updatePlace', function() {
    it('should update place informations', function() {
      return datasets.load(fixtures.onePlace).then(function() {
        var place = models.Place.forge({id: 1, name: 'retiro', latitude: -11.999999, longitude: -11.888888, radius: 150});
        var user = models.User.forge({id: 1});
        return circleService.updatePlace(user, place);
      }).then(function(place) {
        return models.Place.forge({id: place.id}).fetch();
      }).then(function(place) {
        assert.strictEqual(place.get('name'), 'retiro');
        assert.strictEqual(place.get('latitude'), -11.999999);
        assert.strictEqual(place.get('longitude'), -11.888888);
        assert.strictEqual(place.get('radius'), 150);
      });
    });

    it('should create the user activity "place_updated" and notifications when updates place informations', function() {
      var circle = models.Circle.forge({id: 1});
      var user = models.User.forge({id: 2});
      var now = moment().millisecond(0).toDate();
      return datasets.load(fixtures.onePlace).bind({}).then(function() {
        var place = models.Place.forge({id: 1, name: 'retiro'});
        return circleService.updatePlace(user, place);
      }).then(function(place) {
        return models.Place.forge({id: place.id}).fetch();
      }).then(function(place) {
        this.place = place;
        return Promise.delay(200);
      }).then(function() {
        return models.UserActivity.forge({circle_id: circle.id, user_id: user.id}).fetch();
      }).then(function(userActivity) {
        assert.isNotNull(userActivity);
        this.userActivity = userActivity;
        assert.strictEqual(userActivity.get('circle_id'), circle.id);
        assert.strictEqual(userActivity.get('place_id'), this.place.id);
        assert.strictEqual(userActivity.get('user_id'), user.id);
        assert.strictEqual(userActivity.get('particular'), 0);
        assert.strictEqual(userActivity.get('type'), 'place_updated');
        assert.isNull(userActivity.get('parameters'));
        assert.isTrue(userActivity.get('occurrence_date').getTime() === now.getTime() || userActivity.get('occurrence_date').getTime() > now.getTime());
        return models.UserNotification.collection().fetch({withRelated: ['activity']});
      }).then(function(notifications) {
        assert.strictEqual(notifications.length, 2);
        var notification = notifications.at(0);
        assert.strictEqual(notification.related('activity').get('user_id'), user.id);
        assert.strictEqual(notification.get('related_id'), 1);
        assert.strictEqual(notification.get('activity_id'), this.userActivity.id);
        assert.strictEqual(notification.get('viewed'), 0);
        var otherNotification = notifications.at(1);
        assert.strictEqual(otherNotification.related('activity').get('user_id'), user.id);
        assert.strictEqual(otherNotification.get('related_id'), 3);
        assert.strictEqual(otherNotification.get('activity_id'), this.userActivity.id);
        assert.strictEqual(otherNotification.get('viewed'), 0);
      });
    });

    it('should update an event place', function() {
      var startDate = new Date(2015, 5, 10, 12, 12, 12);
      var endDate = new Date(2015, 5, 15, 12, 12, 12);
      return datasets.load(fixtures.oneEvent).then(function() {
        var place = models.Place.forge({id: 1, name: 'retiro', latitude: -11.999999, longitude: -11.888888, radius: 450, start_date: startDate, end_date: endDate});
        var user = models.User.forge({id: 1});
        return circleService.updatePlace(user, place);
      }).then(function(place) {
        assert.strictEqual(place.get('start_date').getTime(), startDate.getTime());
        assert.strictEqual(place.get('end_date').getTime(), endDate.getTime());
        assert.isAbove(place.get('end_date').getTime(), place.get('start_date').getTime());
        assert.strictEqual(place.get('name'), 'retiro');
        assert.strictEqual(place.get('latitude'), -11.999999);
        assert.strictEqual(place.get('longitude'), -11.888888);
        assert.strictEqual(place.get('radius'), 450);
      });
    });

    it('should not update a place when user has no permission', function() {
      return datasets.load(fixtures.onePlace).then(function() {
        var place = models.Place.forge({id: 1});
        var user = models.User.forge({id: 3});
        return circleService.updatePlace(user, place);
      }).then(function(place) {
        assert.fail('It should not update a place because user has no permission');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'place.update.noPermission');
      });
    });

    it('should not update a place when user does not exist', function() {
      return datasets.load(fixtures.onePlace).then(function() {
        var place = models.Place.forge({id: 1});
        var user = models.User.forge({id: 4000});
        return circleService.updatePlace(user, place);
      }).then(function(place) {
        assert.fail('It should not update a place when user does not exist');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'member.doesNotExists');
      });
    });

    it('should set start_date and end_date to null when turns an event into a place.', function() {
      return datasets.load(fixtures.oneEvent).then(function() {
        var event = models.Place.forge({id: 1});
        event.set('type', constants.placeTypes.PLACE);
        var user = models.User.forge({id: 1});
        return circleService.updatePlace(user, event);
      }).then(function(place) {
        assert.isNull(place.get('start_date'));
        assert.isNull(place.get('end_date'));
        assert.strictEqual(place.get('type'), constants.placeTypes.PLACE);
      });
    });
  });

  describe('#removePlace', function() {
    it('should remove a place', function() {
      var place = models.Place.forge({id: 1});
      return datasets.load([fixtures.circleWithOneUser, fixtures.onePlaceInCircle]).then(function() {
        var user = models.User.forge({id: 1});
        return circleService.removePlace(user, place);
      }).then(function(result) {
        assert.isUndefined(result);
        return place.fetch();
      }).then(function(place) {
        assert.isNull(place);
      });
    });

    it('should create the user activity "place_removed" and notifications when removes a place', function() {
      var place = models.Place.forge({id: 1});
      var circle = models.Circle.forge({id: 1});
      var now = moment().millisecond(0).toDate();
      return datasets.load([fixtures.circleWithTwoUsers, fixtures.onePlaceInCircle]).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        return circleService.removePlace(user, place);
      }).then(function() {
        return Promise.delay(200);
      }).then(function() {
        return models.UserActivity.forge({circle_id: circle.id}).fetch();
      }).then(function(userActivity) {
        this.userActivity = userActivity;
        assert.strictEqual(userActivity.get('circle_id'), circle.id);
        assert.strictEqual(userActivity.get('user_id'), 1);
        assert.strictEqual(userActivity.get('particular'), 0);
        assert.strictEqual(userActivity.get('type'), 'place_removed');
        assert.isTrue(userActivity.get('occurrence_date').getTime() === now.getTime() || userActivity.get('occurrence_date').getTime() > now.getTime());
        assert.deepEqual(JSON.parse(userActivity.get('parameters')), {place_id: 1, place_name: 'Home'});
        return models.UserNotification.collection().fetch({withRelated: ['activity']});
      }).then(function(notifications) {
        assert.strictEqual(notifications.length, 1);
        var notification = notifications.at(0);
        assert.strictEqual(notification.related('activity').get('user_id'), 1);
        assert.strictEqual(notification.get('related_id'), 2);
        assert.strictEqual(notification.get('activity_id'), this.userActivity.id);
        assert.strictEqual(notification.get('viewed'), 0);
      });
    });

    it('should not remove a place when user has no permission', function() {
      var place = models.Place.forge({id: 1});
      return datasets.load([fixtures.circleWithTwoUsers, fixtures.onePlaceInCircle]).then(function() {
        var user = models.User.forge({id: 2});
        return circleService.removePlace(user, place);
      }).then(function(place) {
        assert.fail('It should not remove a place because user has no permission');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'place.remove.noPermission');
      });
    });
  });

  describe('#getCircle', function() {
    it('should retrieve a circle and it\'s places and events', function() {
      return datasets.load([fixtures.circleWithOneUser, fixtures.onePlaceInCircle, fixtures.oneEventInCircle]).then(function() {
        return circleService.getCircle(1, true);
      }).then(function(circle) {
        assert.strictEqual(circle.get('name'), 'Family');
        assert.strictEqual(circle.get('location_mode'), 'anytime');
        assert.strictEqual(circle.get('creator_id'), 1);

        var places = circle.related('places');
        assert.strictEqual(places.length, 2);

        var place = places.at(0);
        assert.strictEqual(place.id, 1);
        assert.strictEqual(place.get('type'), 'place');
        assert.strictEqual(place.get('circle_id'), 1);
        assert.strictEqual(place.get('creator_id'), 1);
        assert.strictEqual(place.get('name'), 'Home');
        assert.strictEqual(place.get('latitude'), -12.973325);
        assert.strictEqual(place.get('longitude'), -38.481951);
        assert.strictEqual(place.get('radius'), 300);

        var event = places.at(1);
        assert.strictEqual(event.id, 2);
        assert.strictEqual(event.get('type'), 'event');
        assert.strictEqual(event.get('circle_id'), 1);
        assert.strictEqual(event.get('creator_id'), 1);
        assert.strictEqual(event.get('name'), 'Home Party')
        assert.strictEqual(event.get('latitude'), -12.973325);
        assert.strictEqual(event.get('longitude'), -38.481951);
        assert.strictEqual(event.get('radius'), 300);

        var startDate = moment().year(2015).month(3).date(4).hour(19).startOf('hour').toDate();
        var endDate = moment().year(2015).month(3).date(4).hour(21).startOf('hour').toDate()
        assert.strictEqual(event.get('start_date').getTime(), startDate.getTime());
        assert.strictEqual(event.get('end_date').getTime(), endDate.getTime());
      });
    });
  });

  describe('#changeMemberLocationMode', function() {
    it('should update the user location mode inside a circle', function() {
      var user = models.User.forge({id: 1});
      var circle = models.Circle.forge({id: 1});
      var member = models.Member.forge({id: 1});
      return datasets.load([fixtures.circleWithOneUser]).then(function() {
        return circleService.changeMemberLocationMode(user, member, 'places_only');
      }).then(function(member) {
        assert.strictEqual(member.get('user_id'), user.id);
        assert.strictEqual(member.get('circle_id'), circle.id);
        assert.strictEqual(member.get('location_mode'), 'places_only');
      });
    });

    it('should create the user activities "location_mode_changed" with no notifications', function() {
      var user = models.User.forge({id: 1});
      var circle = models.Circle.forge({id: 1});
      var member = models.Member.forge({id: 1});
      var now = moment().millisecond(0);
      return datasets.load([fixtures.circleWithOneUser]).then(function() {
        return circleService.changeMemberLocationMode(user, member, 'places_only');
      }).then(function() {
        return Promise.delay(200);
      }).then(function() {
        return Promise.all([models.UserActivity.collection().fetch(), models.UserNotification.collection().fetch()]);
      }).spread(function(activities, notifications) {
        assert.strictEqual(activities.length, 1);
        assert.strictEqual(notifications.length, 0);
        var userActivity = activities.at(0);
        assert.strictEqual(userActivity.get('circle_id'), circle.id);
        assert.strictEqual(userActivity.get('user_id'), user.id);
        assert.strictEqual(userActivity.get('type'), 'location_mode_changed');
        assert.strictEqual(userActivity.get('particular'), 0);
        assert.deepEqual(JSON.parse(userActivity.get('parameters')), {location_mode: 'places_only'});
        assert.isAbove(moment(userActivity.get('occurrence_date')).diff(now), -1);
      });
    });

    it('should throw error when member does not exist', function() {
      var user = models.User.forge({id: 1});
      var member = models.Member.forge({id: 300});
      return datasets.load([fixtures.circleWithOneUser]).then(function() {
        return circleService.changeMemberLocationMode(user, member, 'places_only');
      }).then(function(member) {
        assert.fail('should throw error when member does not exist.');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'member.doesNotExists');
      });
    });

    it('should throw error when user tries to update location mode to higher vibilitity', function() {
      var user = models.User.forge({id: 1});
      var member = models.Member.forge({id: 1});
      return datasets.load([fixtures.circleWithLocationModePlacesOnlyAndOneUser]).then(function() {
        return circleService.changeMemberLocationMode(user, member, 'anytime');
      }).then(function(member) {
        assert.fail('should throw error when user tries to update location mode to higher vibilitity.');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'member.changeLocationMode.moreVisibility');
      });
    });
  });

  describe('#listUsersWithinPlace', function() {
    it('should list all users that are within a place', function() {
      var firstUser = models.User.forge({id: 1});
      var secondUser = models.User.forge({id: 2});
      var thirdUser = models.User.forge({id: 3});

      var circle = models.Circle.forge({id: 1});
      var place = models.Place.forge({id: 1});

      var placeCache = {id: 1, latitude: -12.973325, longitude: -38.481951, radius: 300};
      var firstPosition = {latitude: -12.976365, longitude: -38.483341}; // Outside place
      var secondPosition = {latitude: -12.973611, longitude: -38.481393}; // Inside place

      return datasets.load([fixtures.circleWithThreeUsers, fixtures.onePlaceInCircle]).then(function() {
        return circleService.getCircle(circle.id);
      }).then(function() {
        return Promise.delay(200);
      }).then(function() {
        return Promise.all([userService.updateUserPosition(firstUser, firstPosition), userService.updateUserPosition(secondUser, firstPosition), userService.updateUserPosition(thirdUser, secondPosition)]);
      }).then(function() {
        return circleService.listUsersWithinPlace(place);
      }).then(function(usersWithinPlace) {
        assert.strictEqual(usersWithinPlace.length, 1);
        assert.strictEqual(usersWithinPlace.at(0).id, 3);
        assert.strictEqual(usersWithinPlace.at(0).get('first_name'), 'Joana');
        return Promise.all([userService.updateUserPosition(firstUser, secondPosition), userService.updateUserPosition(secondUser, secondPosition), userService.updateUserPosition(thirdUser, secondPosition)]);
      }).then(function() {
        return circleService.listUsersWithinPlace(place);
      }).then(function(usersWithinPlace) {
        assert.strictEqual(usersWithinPlace.length, 3);
        assert.strictEqual(usersWithinPlace.at(0).id, 1);
        assert.strictEqual(usersWithinPlace.at(0).get('first_name'), 'Sandro');
        assert.strictEqual(usersWithinPlace.at(1).id, 2);
        assert.strictEqual(usersWithinPlace.at(1).get('first_name'), 'Wesley');
        assert.strictEqual(usersWithinPlace.at(2).id, 3);
        assert.strictEqual(usersWithinPlace.at(2).get('first_name'), 'Joana');
        return Promise.all([userService.updateUserPosition(firstUser, secondPosition), userService.updateUserPosition(secondUser, secondPosition), userService.updateUserPosition(thirdUser, firstPosition)]);
      }).then(function() {
        return circleService.listUsersWithinPlace(place);
      }).then(function(usersWithinPlace) {
        assert.strictEqual(usersWithinPlace.length, 2);
        assert.strictEqual(usersWithinPlace.at(0).id, 1);
        assert.strictEqual(usersWithinPlace.at(0).get('first_name'), 'Sandro');
        assert.strictEqual(usersWithinPlace.at(1).id, 2);
        assert.strictEqual(usersWithinPlace.at(1).get('first_name'), 'Wesley');
      });
    });
  });

  describe('#listInvitations', function() {
    it('should get only the first page when page number is one', function() {
      return datasets.load(fixtures.threeCirclesAndThreeInvitations).then(function() {
        return models.User.forge({id: 4}).fetch();
      }).then(function(user) {
        return circleService.listInvitations(user, 1, 1);
      }).then(function(invitations) {
        assert.strictEqual(invitations.length, 1);
        var invitation = invitations.at(0);
        assert.strictEqual(invitation.id, '3');
        assert.strictEqual(invitation.get('circle_id'), 2);
        assert.strictEqual(invitation.get('user_id'), 2);
        assert.strictEqual(invitation.get('guest_id'), 4);
      });
    });

    it('should get only the second page when page number is two', function() {
      return datasets.load(fixtures.threeCirclesAndThreeInvitations).then(function() {
        return models.User.forge({id: 4}).fetch();
      }).then(function(user) {
        return circleService.listInvitations(user, 2, 1);
      }).then(function(invitations) {
        assert.strictEqual(invitations.length, 1);
        var invitation = invitations.at(0);
        assert.strictEqual(invitation.id, '4');
        assert.strictEqual(invitation.get('circle_id'), 3);
        assert.strictEqual(invitation.get('user_id'), 3);
        assert.strictEqual(invitation.get('guest_id'), 4);
      });
    });

    it('should list invitations with the same user email or phone', function() {
      return datasets.load(fixtures.invitationsByEmailOrPhone).then(function() {
        return models.User.forge({id: 2}).fetch();
      }).then(function(user) {
        return circleService.listInvitations(user, 1, 10);
      }).then(function(invitations) {
        assert.strictEqual(invitations.length, 2);
        var firstInvitation = invitations.at(0);
        assert.strictEqual(firstInvitation.id, '2');
        assert.strictEqual(firstInvitation.get('circle_id'), 2);
        assert.strictEqual(firstInvitation.get('user_id'), 1);
        assert.isNull(firstInvitation.get('guest_id'));
        var firstGuestInformations = firstInvitation.related('guestInformations');
        assert.strictEqual(firstGuestInformations.length, 1);
        assert.strictEqual(firstGuestInformations.at(0).id, 2);
        assert.strictEqual(firstGuestInformations.at(0).get('invitation_id'), '2');
        assert.strictEqual(firstGuestInformations.at(0).get('type'), 'phone');
        assert.strictEqual(firstGuestInformations.at(0).get('value'), '+557199999992');

        var secondInvitation = invitations.at(1);
        assert.strictEqual(secondInvitation.id, '1');
        assert.strictEqual(secondInvitation.get('circle_id'), 1);
        assert.strictEqual(secondInvitation.get('user_id'), 1);
        assert.isNull(secondInvitation.get('guest_id'));
        var secondGuestInformations = secondInvitation.related('guestInformations');
        assert.strictEqual(secondGuestInformations.length, 1);
        assert.strictEqual(secondGuestInformations.at(0).id, 1);
        assert.strictEqual(secondGuestInformations.at(0).get('invitation_id'), '1');
        assert.strictEqual(secondGuestInformations.at(0).get('type'), 'email');
        assert.strictEqual(secondGuestInformations.at(0).get('value'), 'wesley@email.com');
      });
    });
  });

  describe('#inviteUser', function() {
    it('should permite to invite when user is the circle owner', function() {
      return datasets.load([fixtures.circleWithOneUser, fixtures.anotherUser]).then(function() {
        var circle = models.Circle.forge({id: 1});
        var user = models.User.forge({id: 1});
        var guest = models.User.forge({id: 10});
        return circleService.inviteUser(circle, user, guest);
      }).then(function(invitation) {
        return models.Invitation.forge({id: invitation.id}).fetch({withRelated: ['guestInformations']});
      }).then(function(invitation) {
        assert.isNotNull(invitation.id);
        assert.strictEqual(invitation.get('circle_id'), 1);
        assert.strictEqual(invitation.get('user_id'), 1);
        assert.strictEqual(invitation.get('guest_id'), 10);
        assert.strictEqual(invitation.related('guestInformations').length, 0);
      });
    });

    it('should not permite to invite another user when user does not belong to circle', function() {
      return datasets.load([fixtures.circleWithOneUser, fixtures.anotherUser]).then(function() {
        var circle = models.Circle.forge({id: 1});
        var user = models.User.forge({id: 10});
        var guest = models.User.forge({id: 1});
        return circleService.inviteUser(circle, user, guest);
      }).then(function(invite) {
        assert.fail('It should not permite to invite another user when user is not the circle owner');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'member.doesNotExists');
      });
    });

    it('should not permite to invite another user when user is not the circle owner', function() {
      return datasets.load([fixtures.circleWithTwoUsers, fixtures.anotherUser]).then(function() {
        var circle = models.Circle.forge({id: 1});
        var user = models.User.forge({id: 2});
        var guest = models.User.forge({id: 10});
        return circleService.inviteUser(circle, user, guest);
      }).then(function(invite) {
        assert.fail('It should not permite to invite another user when user is not the circle owner');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'circle.invitation.noPermission');
      });
    });
  });

  describe('#inviteContacts', function() {
    it('should permite to invite contacts when user is the circle owner', function() {
      return datasets.load([fixtures.circleWithOneUser]).then(function() {
        var circle = models.Circle.forge({id: 1});
        var user = models.User.forge({id: 1});
        var contacts = [{name: 'Maday Avila', emails: ['maday@email.com', 'maday@anotheremail.com'], phones: ['+557188888888', '+55 71 7777-7777']}];
        return circleService.inviteContacts(circle, user, contacts);
      }).then(function(invitations) {
        assert.strictEqual(invitations.length, 1);
        return models.Invitation.forge({id: invitations.at(0).id}).fetch({withRelated: ['guestInformations']});
      }).then(function(invitation) {
        assert.isNotNull(invitation.id);
        assert.strictEqual(invitation.get('circle_id'), 1);
        assert.strictEqual(invitation.get('user_id'), 1);
        assert.isNull(invitation.get('guest_id'));
        var guestInformations = invitation.related('guestInformations');
        assert.strictEqual(guestInformations.length, 4);
        assert.strictEqual(guestInformations.at(0).get('invitation_id'), invitation.id);
        assert.strictEqual(guestInformations.at(0).get('type'), 'email');
        assert.strictEqual(guestInformations.at(0).get('value'), 'maday@email.com');
        assert.strictEqual(guestInformations.at(1).get('invitation_id'), invitation.id);
        assert.strictEqual(guestInformations.at(1).get('type'), 'email');
        assert.strictEqual(guestInformations.at(1).get('value'), 'maday@anotheremail.com');
        assert.strictEqual(guestInformations.at(2).get('invitation_id'), invitation.id);
        assert.strictEqual(guestInformations.at(2).get('type'), 'phone');
        assert.strictEqual(guestInformations.at(2).get('value'), '+557188888888');
        assert.strictEqual(guestInformations.at(3).get('invitation_id'), invitation.id);
        assert.strictEqual(guestInformations.at(3).get('type'), 'phone');
        assert.strictEqual(guestInformations.at(3).get('value'), '+55 71 7777-7777');
      });
    });

    it('should not permite to invite contacts when user is not the circle owner', function() {
      return datasets.load([fixtures.circleWithTwoUsers]).then(function() {
        var circle = models.Circle.forge({id: 1});
        var user = models.User.forge({id: 2});
        var contacts = [{name: 'Maday Avila', emails: ['maday@email.com', 'maday@anotheremail.com'], phones: ['+557199999999', '+557188888888', '+55 71 7777-7777']}];
        return circleService.inviteContacts(circle, user, contacts);
      }).then(function(invitation) {
        assert.fail('It should not permite to invite another user when user is not the circle owner');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'circle.invitation.noPermission');
      });
    });
  });

  describe('#acceptInvitation', function() {
    it('should accept the user invite', function() {
      return datasets.load(fixtures.circleWithOneUserAndOneInvitation).bind({}).then(function() {
        return models.Invitation.forge({id: '1'}).fetch();
      }).then(function(invitation) {
        this.invitation = invitation;
        var user = models.User.forge({id: invitation.get('guest_id')});
        return circleService.acceptInvitation(user, invitation);
      }).then(function(member) {
        assert.isDefined(member);
        assert.strictEqual(member.get('id'), 2);
        assert.strictEqual(member.get('circle_id'), 1);
        assert.strictEqual(member.get('user_id'), 2);
        assert.strictEqual(member.get('location_mode'), 'anytime');
        assert.strictEqual(member.get('permission'), 'user');
        return models.Invitation.forge({id: '1'}).fetch();
      }).then(function(invitation) {
        assert.isNull(invitation);
      });
    });
  });

  describe('#refuseInvitation', function() {
    it('should refuse an invitation', function() {
      return datasets.load(fixtures.circleWithOneUserAndOneInvitation).bind({}).then(function() {
        return models.Invitation.forge({id: '1'}).fetch();
      }).then(function(invitation) {
        this.invitation = invitation;
        var user = models.User.forge({id: invitation.get('guest_id')});
        return circleService.refuseInvitation(user, invitation);
      }).then(function() {
        return models.Member.forge({user_id: this.invitation.get('user_id'), circle_id: this.invitation.get('circle_id'), permission: constants.circlePermissions.USER}).fetch();
      }).then(function(member) {
        assert.isNull(member);
        return models.Invitation.forge({id: this.invitation.get('invitation_id')}).fetch();
      }).then(function(invitation) {
        assert.isNull(invitation);
      });
    });
  });

  describe('#listMembers', function() {
    it('should return all members of circle', function() {
      return datasets.load(fixtures.circleWithThreeUsers).bind({}).then(function() {
        var circle = models.Circle.forge({id: 1});
        return circleService.listMembers(circle);
      }).then(function(members) {
        assert.strictEqual(members.length, 3);
        assert.strictEqual(members.at(0).id, 1);
        assert.strictEqual(members.at(0).get('permission'), 'owner');
        assert.strictEqual(members.at(1).id, 2);
        assert.strictEqual(members.at(1).get('permission'), 'admin');
        assert.strictEqual(members.at(2).id, 3);
        assert.strictEqual(members.at(2).get('permission'), 'user');
      });
    });
  });

  describe('#listCircles', function() {
    it('should list all circles of user', function() {
      return datasets.load(fixtures.invitationsByEmailOrPhone).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        return circleService.listCircles(user);
      }).then(function(circles) {
        assert.strictEqual(circles.length, 2);
        assert.strictEqual(circles.at(0).id, 1);
        assert.strictEqual(circles.at(0).get('name'), 'Family');
        assert.strictEqual(circles.at(1).id, 2);
        assert.strictEqual(circles.at(1).get('name'), 'Work');
      });
    });
  });

  describe('#listCirclesByIds', function() {
    it('should list all circle by given ids', function() {
      return datasets.load(fixtures.threeCirclesAndThreeInvitations).bind({}).then(function() {
        return circleService.listCirclesByIds([1, 2, 3]);
      }).then(function(circles) {
        assert.strictEqual(circles.length, 3);
        assert.strictEqual(circles.at(0).id, 1);
        assert.strictEqual(circles.at(0).get('name'), 'Family1');
        assert.strictEqual(circles.at(1).id, 2);
        assert.strictEqual(circles.at(1).get('name'), 'Family2');
        assert.strictEqual(circles.at(2).id, 3);
        assert.strictEqual(circles.at(2).get('name'), 'Family3');
      });
    });
  });

   describe('#listUserMembers', function() {
    it('should list all member entities associated with user', function() {
      return datasets.load(fixtures.invitationsByEmailOrPhone).bind({}).then(function() {
        var user = models.User.forge({id: 1});
        return circleService.listUserMembers(user);
      }).then(function(members) {
        assert.strictEqual(members.length, 2);
        assert.strictEqual(members.at(0).id, 1);
        assert.strictEqual(members.at(0).get('user_id'), 1);
        assert.strictEqual(members.at(0).get('circle_id'), 1);
        assert.strictEqual(members.at(0).get('permission'), 'owner');
        assert.strictEqual(members.at(1).id, 2);
        assert.strictEqual(members.at(1).get('user_id'), 1);
        assert.strictEqual(members.at(1).get('circle_id'), 2);
        assert.strictEqual(members.at(1).get('permission'), 'owner');
      });
    });
  });

  describe('#listUsers', function() {
    it('should list all users of a circle', function() {
      return datasets.load(fixtures.circleWithThreeUsers).bind({}).then(function() {
        var circle = models.Circle.forge({id: 1});
        return circleService.listUsers(circle);
      }).then(function(users) {
        assert.strictEqual(users.length, 3);
        assert.strictEqual(users.at(0).id, 1);
        assert.strictEqual(users.at(0).get('first_name'), 'Sandro');
        assert.strictEqual(users.at(1).id, 2);
        assert.strictEqual(users.at(1).get('first_name'), 'Wesley');
        assert.strictEqual(users.at(2).id, 3);
        assert.strictEqual(users.at(2).get('first_name'), 'Joana');
      });
    });
  });

  describe('#listPlaces', function() {
    it('should list all users of a circle', function() {
      return datasets.load(fixtures.circleToRemove).bind({}).then(function() {
        var circle = models.Circle.forge({id: 1});
        return circleService.listPlaces(circle);
      }).then(function(places) {
        assert.strictEqual(places.length, 2);
        assert.strictEqual(places.at(0).id, 1);
        assert.strictEqual(places.at(0).get('name'), 'Ericsson Inovação');
        assert.strictEqual(places.at(1).id, 2);
        assert.strictEqual(places.at(1).get('name'), 'Pituaçu');
      });
    });
  });

  describe('#leaveCircle', function() {
    it('should remove the circle when there remains no members', function() {
      return datasets.load(fixtures.circleWithOneUser).then(function() {
        var user = models.User.forge({id: 1});
        var circle = models.Circle.forge({id: 1});
        return circleService.leaveCircle(circle, user);
      }).then(function() {
        return Promise.all([models.Circle.fetchAll(), models.Member.fetchAll()]);
      }).spread(function(circles, members) {
        assert.isTrue(circles.isEmpty());
        assert.isTrue(members.isEmpty());
      });
    });

    it('should set an administrator as the circle owner when the owner leaves the circle', function() {
      return datasets.load(fixtures.circleWithThreeUsers).then(function() {
        var user = models.User.forge({id: 1});
        var circle = models.Circle.forge({id: 1});
        return circleService.leaveCircle(circle, user);
      }).then(function() {
        return models.Member.forge({id: 2}).fetch();
      }).then(function(member){
        assert.strictEqual(member.get('permission'), constants.circlePermissions.OWNER);
      });
    });

    it('should set a non administrator as the circle owner when the owner leaves the circle', function() {
      return datasets.load(fixtures.circleWithTwoUsers).then(function() {
        var user = models.User.forge({id: 1});
        var circle = models.Circle.forge({id: 1});
        return circleService.leaveCircle(circle, user);
      }).then(function() {
        return models.Member.forge({id: 2}).fetch();
      }).then(function(member){
        assert.strictEqual(member.get('permission'), constants.circlePermissions.OWNER);
      });
    });
  });

// TODO:
  //   #createCircle (It should validate circle name length)
  //   #recentActivities
  //   #recentCirclesActivities
  //   #updateMember
  //   #listNotifications
  //   #markAsViewed
  //   #listMemberActivities
  //   #inviteContacts (It should associate the guest_id)
  //   #inviteContacts (It should invoke notifier.notifyInvitation)
  //   #inviteContacts (It should ignore to invite contacts that are circle members)
  //   #inviteContacts (It should ignore to invite contacts that already has an invitation)
  //   #acceptInvitation (It should create the new member activity and its notifications)
  //   #acceptInvitation (It should invoke notifier.notifyActivity passing the new_member activity)
  //   #removeMember (It should create the member removed activity and its notifications)
  //   #removeMember (It should invoke notifier.notifyActivity passing the member_removed activity)
  //   #listUserMembers
  //   #changeMemberPermission
  //   #leaveCircle
  //   #leaveCircle (It should create the member left activity and its notifications)
  //   #removeCircle (It should remove the circle avatar file)
  //   #removeCircle (It should remove all places avatars files)
  //   #removePlace (It should update all related user activity to set place_id with null and parameters with the place name)
  //   #removePlace (It should invoke eventScheduler.removeScheduling)
  //   #removePlace (It should remove the place avatar file)
  //   #createPlace (It should validate place name length)
  //   #createPlace (It should validate event required attributes when repeat event is 0)
  //   #createPlace (It should validate event required attributes when repeat event is 1)
  //   #createPlace (It should create with avatar)
  //   #createPlace (It should fail when passes an invalid radius)
  //   #createPlace (It should validate event fields)
  //   #createEvent (It should create with avatar)
  //   #createEvent (It should invoke eventScheduler.schedule)
  //   #createEvent (It should fail when passes an end date before start date)
  //   #createEvent (It should fail when passes an invalid radius)
  //   #updatePlace (It should update with avatar)
  //   #updatePlace (It should invoke eventScheduler.updateScheduling)
  //   #updatePlace (It should fail when passes an invalid radius)
  //   #updatePlace (It should validate event fields)
  //   #updatePlace (It should validate event required attributes when repeat event is 0)
  //   #updatePlace (It should validate event required attributes when repeat event is 1)
  //   #updatePlace (It should validate place name length)
  //   #listEventsOfTheDay (It should list all events that can be scheduled)
  //   #changeMemberLocationMode (It should notify activity to all circle members)
  //   #listChatMessages (It should list chat messages ordered)
  //   #sendChatMessage (It should save the chat message)
  //   #sendChatMessage (It should notify circle room)
  //   #listNotifications (It should paginate notifications)
  //   #listMemberActivities (It should paginate activities of a member)
  //   #listPlaceActivities (It should paginate activities in place)
  //   #recentActivities (It should not return activities with null place id)
  //   #recentCircleActivities (It should not return activities with null place id)
  //   #recentCirclesActivities (It should not return activities with null place id)
  //   #inviteContacts (It should not save empty guest information)
  //   #removeMember (It should not remove the circle owner)
  //   #changeMemberPermission (It should not change the owner permission)
});