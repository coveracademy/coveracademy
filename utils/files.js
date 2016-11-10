'use strict';

var settings   = require('../configs/settings'),
    fs         = require('fs'),
    shortid    = require('shortid'),
    moment     = require('moment').utc,
    formidable = require('formidable'),
    Promise    = require('bluebird'),
    $          = this;

exports.parseFiles = function(req, uploadConfig) {
  return new Promise(function(resolve, reject) {
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadConfig.directory;
    form.encoding = uploadConfig.encoding;
    form.parse(req, function(err, form, stream) {
      if(err) {
        reject(err);
        return;
      }
      console.log(form)
      var file = stream.files;
      var fields = form.fields ? JSON.parse(form.fields) : {};
      if(file) {
        $.renameFile(file.path, uploadConfig).then(function(filename) {
          resolve({fields: fields, file: filename});
        }).catch(function(err) {
          reject(err);
        });
      } else {
        resolve({fields: fields});
      }
    });
  });
};

exports.generateFilename = function(uploadConfig) {
  return moment().format('YYYYMMDDHH') + '_' + shortid.generate() + uploadConfig.extension;
};

exports.renameFile = function(filename, uploadConfig) {
  return new Promise(function(resolve, reject) {
    var newFilename = $.generateFilename(uploadConfig);
    fs.rename(filename, uploadConfig.directory + '/' + newFilename, function(err) {
      if(err) {
        reject(err);
      } else {
        resolve(newFilename);
      }
    });
  });
};

exports.removeFile = function(filename, uploadConfig) {
  return new Promise(function(resolve, reject) {
    if(!filename) {
      resolve();
      return;
    }
    fs.unlink(uploadConfig.directory + '/' + filename, function(err) {
      if(err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.removeFiles = function(filesnames, uploadConfig) {
  return Promise.resolve(filesnames).map(function(filename) {
    return $.removeFile(filename, uploadConfig);
  });
};