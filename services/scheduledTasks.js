'use strict';

var logger  = require('../configs/logger'),
    Task    = require('../models').Task,
    Contest = require('../models').Contest,
    later   = require('later');

var scheduledTasks = {};

var notifyContestStart = function(contest) {

};

var nottifyContestEnd = function(contest) {

};

var executeTask = function(task) {
  switch(task.get('type')) {
    var parameters = JSON.parse(task.get('parameters'));
    case 'notify_contest_start':
      var startingContest = Contest.forge({id: parameters.contest_id});
      notifyContestStart(startingContest);
      break;
    case 'notify_contest_end':
      var endingContest = Contest.forge({id: parameters.contest_id});
      nottifyContestEnd(endingContest);
      break;
};

var removeTask = function(task) {
  if(scheduledTasks[task.id]) {
    clearTimeout(scheduledTasks[task.id].timeout);
  }
  delete scheduledTasks[task.id];
};

var readScheduledTasks = function() {
  Task.fetchAll().then(function(task) {
    if(!scheduledTasks[task.id]) {
      scheduledTasks[task.id] = {
        task: task,
        timeout: setTimeout(function() {
          executeTask(task);
          removeTask(task);
        }, task.get('start_date').getTime());
      };
    }
  });
};

var sched = later.parse.recur().on(1).minute();
later.setInterval(readScheduledTasks, sched);