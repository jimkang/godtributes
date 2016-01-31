var bunyan = require('bunyan');
var bsyslog = require('bunyan-syslog');
var util = require('util');

var sysLog = bunyan.createLogger({
  name: 'foo',
  streams: [
    {
      level: 'debug',
      type: 'raw',
      stream: bsyslog.createBunyanStream({
        type: 'sys',
        facility: bsyslog.local0,
        host: '192.168.0.1',
        port: 514
      })
    }
  ]
});

// First param is the topic, the rest get formatted console.log style.
function formatMessage() {
  var topic = arguments[0];
  var theRest = Array.prototype.slice.call(arguments, 1);
  return util.format.apply(util, theRest);
}

function info() {
  sysLog.info(formatMessage(arguments));
}

function warn() {
  sysLog.warn(formatMessage(arguments));
}

function error() {
  sysLog.error(formatMessage(arguments));
}

module.exports = {
  info: info,
  warn: warn,
  error: error,
  sysLog: sysLog
};
