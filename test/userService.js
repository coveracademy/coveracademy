'use strict';

var userService    = require('../apis/userService'),
    circleService  = require('../apis/circleService'),
    messages       = require('../apis/internal/messages'),
    logger         = require('../configs/logger'),
    models         = require('../models'),
    cryptography   = require('../utils/cryptography'),
    datasets       = require('./datasets'),
    circleFixtures = require('./datasets/circleService'),
    userFixtures   = require('./datasets/userService'),
    Promise        = require('bluebird'),
    assert         = require('chai').assert,
    Bookshelf      = models.Bookshelf;

describe('userService', function() {
  beforeEach(function() {
    return datasets.clean();
  });

  describe('#createUser', function() {
    it('should create an user with email', function() {
      return userService.createUser('Sandro', 'Simas', null, 'sandro@email.com', '123456').then(function(user) {
        assert.strictEqual(user.get('first_name'), 'Sandro');
        assert.strictEqual(user.get('last_name'), 'Simas');
        assert.strictEqual(user.get('email'), 'sandro@email.com');
        return cryptography.compare('123456', user.get('password'));
      }).then(function(equals) {
        assert.strictEqual(equals, true);
      });
    });

    it('should create an user with phone', function() {
      return userService.createUser('Sandro', 'Simas', '+557199999999', null, '123456').then(function(user) {
        assert.strictEqual(user.get('first_name'), 'Sandro');
        assert.strictEqual(user.get('last_name'), 'Simas');
        assert.strictEqual(user.get('phone'), '+557199999999');
        return cryptography.compare('123456', user.get('password'));
      }).then(function(equals) {
        assert.strictEqual(equals, true);
      });
    });

    it('should create an user with an associated language', function() {
      return userService.createUser('Sandro', 'Simas', '+557199999999', null, '123456', 'pt').then(function(user) {
        assert.strictEqual(user.get('first_name'), 'Sandro');
        assert.strictEqual(user.get('last_name'), 'Simas');
        assert.strictEqual(user.get('phone'), '+557199999999');
        assert.strictEqual(user.get('language'), 'pt');
        return cryptography.compare('123456', user.get('password'));
      }).then(function(equals) {
        assert.strictEqual(equals, true);
      });
    });

    it('should not create an user when first name are not provided', function() {
      return userService.createUser(undefined, 'Simas', null, 'sandro@email.com', '12356').then(function(user) {
        assert.fail('It should not create an user when first name are not provided');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.first_name.required');
      });
    });

    it('should not create an user when first name is null', function() {
      return userService.createUser(null, 'Simas', null, 'sandro@email.com', '12356').then(function(user) {
        assert.fail('It should not create an user when first name are not provided');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.first_name.invalid');
      });
    });

    it('should not create an user when login are not provided', function() {
      return userService.createUser('Sandro', 'Simas', null, null, '123456').then(function(user) {
        assert.fail('It should not create an user when login are not provided');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.login.required');
      });
    });

    it('should not create an user when password are not provided', function() {
      return userService.createUser('Sandro', 'Simas', null, 'sandro@email.com').then(function(user) {
        assert.fail('It should not create an user when password are not provided');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.password.required');
      });
    });

    it('should create a user and associate with an invitation', function() {
      return datasets.load(require('./datasets/userService').oneInvitation).then(function() {
        return userService.createUser('Wesley', 'Mascarenhas', null, 'wesley@email.com', '123456', 'pt', 'EzaWqdf');
      }).then(function(user) {
        return models.Invitation.forge({id: 'EzaWqdf'}).fetch();
      }).then(function(invitation) {
        assert.strictEqual(invitation.id, 'EzaWqdf');
        assert.strictEqual(invitation.get('circle_id'), 1);
        assert.strictEqual(invitation.get('user_id'), 1);
        assert.strictEqual(invitation.get('guest_id'), 2);
        assert.strictEqual(invitation.get('guest_name'), 'Wesley Mascarenhas');
      });
    });

    it('should create a user and should not associate with the unexistent invitation', function() {
      return datasets.load(require('./datasets/userService').oneInvitation).then(function() {
        return userService.createUser('Wesley', 'Mascarenhas', null, 'wesley@email.com', '123456', 'pt', 'EzaWqdf33de1');
      }).then(function(user) {
        return models.Invitation.collection().fetch();
      }).then(function(invitations) {
        assert.strictEqual(invitations.length, 1);
        var invitation = invitations.at(0);
        assert.strictEqual(invitation.id, 'EzaWqdf');
        assert.strictEqual(invitation.get('circle_id'), 1);
        assert.strictEqual(invitation.get('user_id'), 1);
        assert.strictEqual(invitation.get('guest_name'), 'Wesley Mascarenhas');
        assert.isNull(invitation.get('guest_id'));
      });
    });
  });

  describe('#updateUser', function() {
    it('should update the user last name', function() {
      return datasets.load(userFixtures.oneUser).then(function() {
        return userService.updateUser(models.User.forge({id: 1, last_name: 'Costa Simas'}));
      }).then(function(user) {
        return models.User.forge({id: 1}).fetch();
      }).then(function(user) {
        assert.strictEqual(user.get('first_name'), 'Sandro');
        assert.strictEqual(user.get('last_name'), 'Costa Simas');
        assert.strictEqual(user.get('phone'), '+557199999999');
        assert.strictEqual(user.get('email'), 'sandro@email.com');
      });
    });

    it('should not update an user when a required information is null', function() {
      return datasets.load(userFixtures.oneUser).then(function() {
        return userService.updateUser(models.User.forge({id: 1, first_name: null, last_name: 'Costa Simas'}));
      }).then(function(user) {
        return models.User.forge({id: 1}).fetch();
      }).then(function(user) {
        assert.fail('It should not update an user when a required information is null');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.first_name.invalid');
      });
    });

    it('should not update an user when attribute is not elegible', function() {
      return datasets.load(userFixtures.oneUser).then(function() {
        return userService.updateUser(models.User.forge({id: 1, verified: 1}));
      }).then(function(user) {
        assert.fail('It should not update an user when attribute is not elegible');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.nothingToSave');
      });
    });

    it('should not update an unexistent user', function() {
      return userService.updateUser(models.User.forge({id: 4000, last_name: 'Sandro'})).then(function() {
        assert.fail('It should not update an unexistent user');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.doesNotExist');
      });
    });
  });

  describe('#authenticate', function() {
    it('should authenticate user by email', function() {
      return datasets.load(require('./datasets/userService').authenticate).then(function() {
        return userService.authenticate('sandro@email.com', '123456');
      }).then(function(user) {
        assert.strictEqual(user.get('first_name'), 'Sandro');
        assert.strictEqual(user.get('last_name'), 'Simas');
        assert.strictEqual(user.get('phone'), '+557199999999');
        assert.strictEqual(user.get('email'), 'sandro@email.com');
        assert.strictEqual(user.get('password'), '$2a$10$e7kTlnUSZAXsNlwKOans3.3CEdFgZkkPB8uChMe3iWK1lYusWbwtq');
      });
    });

    it('should authenticate user by phone', function() {
      return datasets.load(require('./datasets/userService').authenticate).then(function() {
        return userService.authenticate('+557199999999', '123456');
      }).then(function(user) {
        assert.strictEqual(user.get('first_name'), 'Sandro');
        assert.strictEqual(user.get('last_name'), 'Simas');
        assert.strictEqual(user.get('phone'), '+557199999999');
        assert.strictEqual(user.get('email'), 'sandro@email.com');
        assert.strictEqual(user.get('password'), '$2a$10$e7kTlnUSZAXsNlwKOans3.3CEdFgZkkPB8uChMe3iWK1lYusWbwtq');
      });
    });

    it('should not authenticate user when login does not exist', function() {
      return datasets.load(require('./datasets/userService').authenticate).then(function() {
        return userService.authenticate('sandrooooooooooo@email.com', '123456');
      }).then(function(user) {
        assert.fail('It should not authenticate user when login does not exist');
      }).catch(messages.APIError, function(err) {
        assert.strictEqual(err.key, 'user.auth.login.notFound');
      });
    });
  });

  describe('#listUsers', function() {
    it('should list users', function() {
      return datasets.load(userFixtures.fourUsers).then(function() {
        return userService.listUsers([3, 1, 4]);
      }).then(function(users) {
        assert.strictEqual(users.length, 3);
        assert.strictEqual(users.at(0).id, 1);
        assert.strictEqual(users.at(1).id, 3);
        assert.strictEqual(users.at(2).id, 4);
      });
    });

    it('should return empty list when no ids is provided', function() {
      return datasets.load(userFixtures.fourUsers).then(function() {
        return userService.listUsers([]);
      }).then(function(users) {
        assert.strictEqual(users.length, 0);
      });
    });

    it('should return empty list when ids parameter is null', function() {
      return datasets.load(userFixtures.fourUsers).then(function() {
        return userService.listUsers(null);
      }).then(function(users) {
        assert.strictEqual(users.length, 0);
      });
    });

    it('should return empty list when ids parameter is undefined', function() {
      return datasets.load(userFixtures.fourUsers).then(function() {
        return userService.listUsers(undefined);
      }).then(function(users) {
        assert.strictEqual(users.length, 0);
      });
    });
  });

  describe('#getUser', function() {
    it('should load an user by id without relateds', function() {
      return datasets.load(circleFixtures.circleWithOneUser).then(function() {
        return userService.getUser(1);
      }).then(function(user) {
        assert.strictEqual(user.get('first_name'), 'Sandro');
        assert.strictEqual(user.get('last_name'), 'Simas');
        assert.strictEqual(user.get('phone'), '+557199999999');
        assert.strictEqual(user.get('email'), 'sandro@email.com');
        assert.strictEqual(user.get('password'), '$2a$10$e7kTlnUSZAXsNlwKOans3.3CEdFgZkkPB8uChMe3iWK1lYusWbwtq');
        assert.strictEqual(user.get('email_verified'), 0);
        assert.strictEqual(user.related('members').length, 0);
        assert.strictEqual(user.related('circles').length, 0);
      });
    });

    it('should load an user by id with circles and members', function() {
      return datasets.load(circleFixtures.circleWithOneUser).then(function() {
        return userService.getUser(1, ['circles', 'members']);
      }).then(function(user){
        var circles = user.related('circles');
        assert.strictEqual(circles.length, 1);
        var circle = circles.at(0);
        assert.strictEqual(circle.get('creator_id'), user.id);
        assert.strictEqual(circle.get('location_mode'), 'anytime');
        var members = user.related('members');
        assert.strictEqual(members.length, 1);
        var member = members.at(0);
        assert.strictEqual(member.get('circle_id'), circle.id);
        assert.strictEqual(member.get('user_id'), user.id);
      });
    });
  });

  // TODO
  //  #notify users when update user location
  //  #createUser (It should validate first and last name length)
  //  #createUser (It should validate password length)
  //  #updateUser (It should validate first and last name length)
  //  #updateUser (It should validate password length)
  //  #updateUser (It should not allow phone and email empty)
  //  #updateUser (It should set null when attributes are empty)
  //  #updateUser (It should throw error when occurs dup entry involving email)
  //  #updateUser (It should throw error when occurs dup entry involving phone)
  //  #updateUser (It should throw error when occurs dup entry involving phone and email)
  //  #updateUserPosition (It should not create user_arrives or user_leaves when the event was not started)
  //  #updateUserPosition (It should not create user_arrives or user_leaves when the event is ended)
  //  #updateUserPosition (It should create user_arrives or user_leaves when the event has began - recurring_event = false)
  //  #updateUserPosition (It should create user_arrives or user_leaves when the event has began - recurring_event = true)
  //  #authenticate (It should update user language)
  //  #authenticate (It should update user logged attribute to 1)
  //  #logout (It should update user logged attribute to 0)
  //  #resetPasswordRequest (It should send email to user)
  //  #resetPasswordRequest (It should send sms to user)
  //  #resetPassword (It should update user password using email or phone encrypted)
  //  #getUser (It should test related and require attributes)
  //  #getUserByEmail (It should test related and require attributes)
  //  #getUserByPhone (It should test related and require attributes)
});