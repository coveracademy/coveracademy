'use strict';

var settings  = require('../configs/settings'),
    constants = require('../apis/internals/constants');

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
  hasTimestamps: ['registration_date'],
  virtuals: {
    progress: function() {
      var now = new Date();
      var startDate = this.get('start_date');
      var endDate = this.get('end_date');
      if(!startDate || !endDate || now < startDate) {
        return constants.CONTEST_WAITING;
      } else if(now > endDate) {
        return constants.CONTEST_FINISHED;
      } else {
        return constants.CONTEST_RUNNING;
      }
    }
  }
});

var ContestWinner = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'contest_winner',
  user: function() {
    return this.belongsTo(User, 'user_id');
  }
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
  hasTimestamps: ['registration_date'],
  user: function() {
    return this.belongsTo(User, 'user_id');
  },
  contest: function() {
    return this.belongsTo(Contest, 'contest_id');
  }
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