// Singleton.

var rollbar = require('rollbar');
var config = require('./config');
var util = require('util');

var rollbarEnabled = (typeof config.rollbarToken === 'string');

if (rollbarEnabled) {
  rollbar.init(config.rollbarToken, {
    handler: 'nextTick'
  });
}

function log() {
  console.log(arguments);

  if (rollbarEnabled && arguments.length > 0) {  
    rollbar.reportMessage(util.format(arguments) + '\n');
  }
}

module.exports = {
  log: log
};
