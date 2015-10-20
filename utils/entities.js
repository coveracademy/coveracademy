'use strict';

var Bookshelf = require('../models').Bookshelf,
    Promise   = require('bluebird');

exports.getIds = function(collection) {
  var ids = [];
  collection.forEach(function(model) {
    ids.push(model.id);
  });
  return ids;
};

exports.isCollection = function(obj) {
  return obj instanceof Bookshelf.Collection;
};

exports.isModel = function(obj) {
  return obj instanceof Bookshelf.Model;
};

exports.requestTransaction = function(transaction, callback) {
  if(transaction) {
    return Promise.resolve(callback(transaction));
  } else {
    return Bookshelf.transaction(callback);
  }
};