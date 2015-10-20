'use strict';

exports.offset = function(page, pageSize) {
  return (page - 1) * pageSize;
}