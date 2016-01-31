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
        facility: bsyslog.facility.user,
        host: '192.168.0.1',
        port: 514
      })
    }
  ]
});

// Console.log style formatting.
function formatMessage() {
  var params = Array.prototype.slice.call(arguments);
  var formatted = '';
  for (var i = 0; i < arguments.length; ++i) {
    if (formatted.length > 0) {
      formatted += ' ';
    }
    var arg = arguments[i];
    if (typeof arg === 'string') {
      formatted += arg;
    }
    else if (typeof arg === 'object') {
      formatted += JSON.stringify(arg);
    }
    else {
      formatted += arg.toString();
    }
  }
  return formatted;
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

module.exports = sysLog;
