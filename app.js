'use strict';

// require('newrelic');
// require('pmx').init();

var express        = require('express'),
    morgan         = require('morgan'),
    cookieParser   = require('cookie-parser'),
    bodyParser     = require('body-parser'),
    redis          = require('redis'),
    path           = require('path'),
    session        = require('jwt-redis-session'),
    logger         = require('./configs/logger'),
    settings       = require('./configs/settings'),
    authentication = require('./configs/authentication'),
    middlewares    = require('./configs/middlewares'),
    routes         = require('./configs/routes'),
    serverLogger   = require('./configs/server-logger');

// Parse string to date when call JSON.parse
require('json.date-extensions');
JSON.useDateParser();

var app = express();

app.set('env', settings.nodeEnv);
app.set('port', settings.nodePort);
app.set('public', settings.publicPath);

app.use(morgan('tiny', {stream: serverLogger.stream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(app.get('public')));

var redisClient = redis.createClient(settings.redis.port, settings.redis.host);
redisClient.auth(settings.redis.password, function(err) {
  if(err) {
    throw new Error('Error authenticating redis');
  }
});

app.use(session({
  client: redisClient,
  secret: 'coveracademy',
  keyspace: 'session:',
  requestArg: 'token'
}));

authentication.configure(app);
middlewares.configure(app);
routes.configure(express, app);

var server = app.listen(app.get('port'), function() {
  logger.info('Cover Academy server is listening on port %s', server.address().port);
});