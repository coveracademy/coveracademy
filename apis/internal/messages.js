'use strict';

var settings        = require('../../configs/settings'),
    util            = require('util'),
    ValidationError = require('bookshelf-filteration').ValidationError;

function APIError(status, key, message, cause) {
  if(!cause && APIError.super_.captureStackTrace) {
    APIError.super_.captureStackTrace(this, this.constructor);
  } else if(cause) {
    this.stack = cause.stack;
  }
  this.name = this.constructor.name;
  this.status = status;
  this.key = key;
  this.message = message;
  this.cause = cause;

  this.json = function() {
    var json = {status: this.status, key: this.key, message: this.message};
    if(settings.debug === true && cause) {
      json.cause = cause.message;
    }
    return json;
  };
  this.toString = function() {
    return this.message;
  };
}
util.inherits(APIError, Error);

function getErrorKey(err) {
  if(err instanceof APIError) {
    return err.key;
  } else {
    return 'internalError';
  }
}

function isDupEntryError(err) {
  return err.code === 'ER_DUP_ENTRY';
}

function isAPIError(err) {
  return err instanceof APIError;
}

function apiError(key, message, cause) {
  return new APIError(400, key, message, cause);
}

function apiErrorWithCode(status, key, message, cause) {
  return new APIError(status, key, message, cause);
}

function unexpectedError(message, cause) {
  return apiError('unexpectedError', message, cause);
}

function internalError(message, cause) {
  return apiErrorWithCode(500, 'internalError', message, cause);
}

function notFoundError(key, message, cause) {
  return apiErrorWithCode(404, key, message, cause);
}

function validationError(prefix, err) {
  if(err instanceof ValidationError) {
    var error = null;
    var firstError = err.errors[0];
    if(firstError.type === 'scenario.notfound') {
      error = internalError(firstError.messages[0], err);
    } else if(firstError.type === 'nothingToSave') {
      error = apiError((prefix ? prefix + '.' : '') + firstError.type, firstError.messages[0], err);
    } else {
      error = apiError((prefix ? prefix + '.' : '') + firstError.attribute + '.' + firstError.type, firstError.messages[0], err);
    }
    return error;
  } else {
    return unexpectedError('', err);
  }
}

function respondWithError(err, res) {
  if(err instanceof APIError) {
    res.status(err.status).json(err.json())
  } else {
    var internal = internalError(err.message, err);
    res.status(internal.status).json(internal.json());
  }
}

function respondWithNotFound(res) {
  res.send(404);
}

function respondWithMovedPermanently(toView, toParams, res) {
  res.status(301).json({toView: toView, toParams: toParams});
}

function respondWithRedirection(toView, toParams, res) {
  res.status(302).json({toView: toView, toParams: toParams});
}

module.exports = {
  getErrorKey: getErrorKey,
  isAPIError: isAPIError,
  isDupEntryError: isDupEntryError,
  apiError: apiError,
  apiErrorWithCode: apiErrorWithCode,
  unexpectedError: unexpectedError,
  internalError: internalError,
  notFoundError: notFoundError,
  validationError: validationError,
  respondWithError: respondWithError,
  respondWithNotFound: respondWithNotFound,
  respondWithMovedPermanently: respondWithMovedPermanently,
  respondWithRedirection: respondWithRedirection,
  APIError: APIError
}