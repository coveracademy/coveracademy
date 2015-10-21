'use strict';

var Bookshelf = require('../models').Bookshelf,
    Promise   = require('bluebird');

exports.requestTransaction = function(transaction, callback) {
  if(transaction) {
    return Promise.resolve(callback(transaction));
  } else {
    return Bookshelf.transaction(callback);
  }
};