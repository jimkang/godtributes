/* global process */

var bunyan = require('bunyan');

var sysLog = bunyan.createLogger({
  name: 'foo',
  streams: [
    {
      level: 'debug',
      stream: process.stdout
    }
  ]
});

// Console.log style formatting.
function formatMessage() {
  var formatted = '';
  for (var i = 0; i < arguments.length; ++i) {
    if (formatted.length > 0) {
      formatted += ' ';
    }
    var arg = arguments[i];
    if (typeof arg === 'string') {
      formatted += arg;
    } else if (typeof arg === 'object') {
      formatted += JSON.stringify(arg);
    } else {
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

module.exports = {
  info: info,
  warn: warn,
  error: error,
  sysLog: sysLog
};
