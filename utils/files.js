'use strict';

var settings   = require('../configs/settings'),
    logger     = require('../configs/logger'),
    path       = require('path'),
    fs         = require('fs'),
    shortid    = require('shortid'),
    moment     = require('moment').utc,
    formidable = require('formidable'),
    aws        = require('aws-sdk'),
    ffmpeg     = require('fluent-ffmpeg'),
    Promise    = require('bluebird'),
    $          = this;

var s3 = new aws.S3(settings.aws.credentials);

const AUDIO_CODEC = 'aac';
const VIDEO_CODEC = 'libx264';
const VIDEO_EXTENSION = 'mp4';
const VIDEO_RESOLUTION_WIDTH = 600;
const VIDEO_RESOLUTION_HEIGHT = 336;
const VIDEO_RESOLUTION = VIDEO_RESOLUTION_WIDTH + 'x' + VIDEO_RESOLUTION_HEIGHT;
const SCREENSHOT_EXTENSION = 'png';

var generateFilename = function(uploadConfig) {
  return moment().format('YYYYMMDDHH') + '_' + shortid.generate();
};

exports.parseFiles = function(req, uploadConfig) {
  return new Promise(function(resolve, reject) {
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadConfig.directory;
    form.encoding = uploadConfig.encoding;
    form.parse(req, function(err, fields, files) {
      if(err) {
        reject(err);
        return;
      }
      var file = files.file;
      if(!file) {
        reject(new Error('No files to parse'));
        return;
      }
      resolve({fields: fields, file: path.basename(file.path)});
    });
  });
};

exports.removeFile = function(filename, uploadConfig) {
  return new Promise(function(resolve, reject) {
    if(!filename) {
      resolve();
      return;
    }
    fs.unlink(path.join(uploadConfig.directory, filename), function(err) {
      if(err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.convertVideo = function(filename, uploadConfig) {
  return new Promise(function(resolve, reject) {
    var newFilename = generateFilename(uploadConfig) + '.' + VIDEO_EXTENSION;
    logger.info('Converting video %s', filename);
    ffmpeg()
      .input(path.join(uploadConfig.directory, filename))
      .fps(29.96)
      .duration(30)
      .aspect('16:9')
      .autopad('white')
      .videoBitrate(3500)
      .videoCodec(VIDEO_CODEC)
      .audioCodec(AUDIO_CODEC)
      .audioFrequency(44100)
      .format(VIDEO_EXTENSION)
      .on('error', function(err) {
        logger.error('Error converting video %s', filename, err);
        reject(err);
      })
      .on('end', function() {
        logger.info('Video %s converted with success to %s', filename, newFilename);
        resolve(newFilename);
      })
      .save(path.join(uploadConfig.directory, newFilename));
  });
};

exports.takeVideoScreenshot = function(filename, uploadConfig) {
  return new Promise(function(resolve, reject) {
    logger.info('Taking screenshot of video %s', filename);
    var extension = path.extname(filename);
    var screenshotName = filename.replace(extension, '') + '.' + SCREENSHOT_EXTENSION;
    ffmpeg(path.join(uploadConfig.directory, filename))
      .on('error', function(err) {
        logger.error('Error taking screenshot of video %s', filename, err);
        reject(err);
      })
      .on('end', function() {
        logger.info('Screenshot of video %s was taken with success', filename);
        resolve(screenshotName);
      })
      .screenshot({
        count: 1,
        timestamps: [0],
        filename: screenshotName,
        folder: uploadConfig.directory,
        size: VIDEO_RESOLUTION
      });
  });
};

exports.uploadToS3 = function(bucket, filename, uploadConfig) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path.join(uploadConfig.directory, filename), function(err, data) {
      if(err) {
        reject(err);
        return;
      }
      var params = {
        Bucket: bucket,
        Key: filename,
        Body: data
      };
      logger.info('Uploading file %s to S3 bucket %s', filename, bucket);
      var upload = s3.upload(params, function(err, data) {
        if(err) {
          logger.info('Error uploading file %s to S3 bucket %s', filename, bucket, err);
          reject(err);
        } else {
          logger.info('Upload of file %s to S3 bucket %s was finished', filename, bucket);
          resolve(data.Location)
        }
      });
      upload.on('httpUploadProgress', function(progress) {
        logger.debug('Upload progress of file %s: %j', filename, progress);
      });
    });
  });
};

// this.uploadToS3(settings.aws.buckets.videos, '2016111117_BJW_GtmZg.mp4', settings.videoUpload).then(function(data) {
//   console.log(data);
// }).catch(function(err) {
//   console.log(err);
// });

// this.convertVideo('upload_6c6e4d3feeb0baa7766e2d26568a2fa9', settings.videoUpload).then(function(data) {
//   console.log(data);
// }).catch(function(err) {
//   console.log(err);
// });

// this.takeVideoScreenshot('2016111417_Sy6gqOvZg.mp4', settings.videoUpload).then(function(data) {
//   console.log(data);
// }).catch(function(err) {
//   console.log(err);
// });