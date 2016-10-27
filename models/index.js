'use strict';

var settings = require('../configs/settings');
var knex = require('knex')({
  client: settings.database.dialect,
  debug: settings.database.debug,
  connection: {
    host: settings.database.host,
    port: settings.database.port,
    user: settings.database.user,
    password: settings.database.password,
    database: 'coveracademy',
    charset: 'utf8',
    timezone: 'UTC'
  }
});

var Bookshelf = require('bookshelf')(knex);
Bookshelf.plugin('virtuals');
Bookshelf.plugin('visibility');
Bookshelf.plugin(require('bookshelf-filteration').plugin);

var Comment = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'comment',
  hasTimestamps: ['registration_date']
});

var Contest = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'contest',
  hasTimestamps: ['registration_date']
});

var ContestWinner = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'contest_winner'
});

var Fan = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'fan',
  hasTimestamps: ['registration_date']
});

var Prize = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'prize'
});

var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  hasTimestamps: ['registration_date']
});

var UserLike = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user_like',
  hasTimestamps: ['registration_date']
});

var Video = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'video',
  hasTimestamps: ['registration_date']
});

module.exports = {
  Bookshelf: Bookshelf,
  Comment: Comment,
  Contest: Contest,
  ContestWinner: ContestWinner,
  Fan: Fan,
  Prize: Prize,
  User: User,
  UserLike: UserLike,
  Video: Video
}