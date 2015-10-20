'use strict';

var knex           = require('../../models').Bookshelf.knex,
    settings       = require('../../configs/settings'),
    tables         = require('./tables'),
    Promise        = require('bluebird'),
    _              = require('lodash'),
    redis          = require('promise-redis')(function(resolver) {
      return new Promise(resolver);
    });

var client = redis.createClient(settings.redis.port, settings.redis.host, {auth_pass: settings.redis.password});

var PromiseWrapper = function(promise) {
  var _promise = promise;
  this.getPromise = function() {
    return _promise;
  };
};

exports.clean = function() {
  return new Promise(function(resolve, reject) {
    if(settings.database.host !== 'localhost') {
      reject(new Error('Cannot clean tables of external environment.'));
      return;
    }
    var wrappers = [];
    wrappers.push(new PromiseWrapper(client.flushdb()));
    tables.forEach(function(table) {
      wrappers.push(new PromiseWrapper(knex(table).del()));
    });
    tables.forEach(function(table) {
      wrappers.push(new PromiseWrapper(knex.schema.raw('alter table ' + table + ' auto_increment = 1')));
    });
    Promise.resolve(wrappers).each(function(wrapper) {
      return wrapper.getPromise();
    }).then(function() {
      resolve();
    });
  });
};

var addLoadWrapper = function(fixture, wrappers) {
  for(var index in fixture) {
    if(index === 'cache') {
      var cacheFixture = fixture[index];
      for(var cacheIndex in cacheFixture) {
        var cacheEntry = cacheFixture[cacheIndex];
        wrappers.push(new PromiseWrapper(client.set(cacheEntry.key, cacheEntry.value)));
      }
    } else {
      wrappers.push(new PromiseWrapper(knex(index).insert(fixture[index])));
    }
  }
};

exports.load = function(fixtures) {
  return new Promise(function(resolve, reject) {
    if(settings.database.host !== 'localhost') {
      reject(new Error('Cannot load fixtures in external environment.'));
      return;
    }
    var wrappers = [];
    if(_.isArray(fixtures)) {
      fixtures.forEach(function(fixture) {
        addLoadWrapper(fixture, wrappers);
      });
    } else {
      addLoadWrapper(fixtures, wrappers);
    }
    Promise.resolve(wrappers).each(function(wrapper) {
      return wrapper.getPromise();
    }).then(function() {
      resolve();
    });
  });
};