'use strict';

var properties = require('properties'),
    path       = require('path'),
    parse      = require('deasync')(properties.parse),
    config     = parse(path.join(__dirname, '../config.properties'), {path: true, sections: true});

exports.getValue = function(key, defaultValue) {
  var value = config;
  var found = true;
  var splits = key.split('.');
  for(let index = 0; index < splits.length; index++) {
    var split = splits[index];
    if(!value[split]) {
      found = false;
      break;
    }
    value = value[split];
  }
  return found === true ? value : defaultValue;
};