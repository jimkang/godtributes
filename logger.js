// Singleton.

var rollbar = require('rollbar');
var config = require('./config');
var util = require('util');

var rollbarEnabled = false;

// First argument is the topic, the rest get formatted console.log style.
function log() {
  var topic = arguments[0];
  var theRest = Array.prototype.slice.call(arguments, 1);
  var payload = {
    level: 'info',
    custom: {
      message: util.format.apply(util, theRest)
    }
  };
  console.log(topic, '|', payload.custom.message);

  if (rollbarEnabled && arguments.length > 0) {
    rollbar.reportMessageWithPayloadData(topic, payload);
  }
}

function turnOffRollbar() {
  rollbarEnabled = false;
  rollbar.shutdown();
  return rollbarEnabled;
}

function turnOnRollbar() {
  rollbarEnabled = (typeof config.rollbarToken === 'string');
  if (rollbarEnabled) {
    rollbar.init(config.rollbarToken, {
      handler: 'nextTick'
    });
  }
  return rollbarEnabled;
}

turnOnRollbar();

module.exports = {
  log: log,
  turnOffRollbar: turnOffRollbar,
  turnOnRollbar: turnOnRollbar
};
