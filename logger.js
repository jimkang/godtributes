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

module.exports = sysLog;
