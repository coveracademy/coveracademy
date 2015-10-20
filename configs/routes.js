'use strict';

var logger = require('./logger');

exports.configure = function(express, app) {
  logger.info('Configuring routes');

  require('../routes/authentication')(express.Router(), app);
  require('../routes/user')(express.Router(), app);
  require('../routes/contest')(express.Router(), app);
  require('../routes/view')(express.Router(), app);
};