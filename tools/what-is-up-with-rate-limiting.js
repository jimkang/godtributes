var Twit = require('twit');
var config = require('../config');
var _ = require('lodash');
var sb = _.curry(require('standard-bail'))(console.log);

var twit = new Twit(config.twitter);

var opts = {
  resources: 'followers,friends,users'
};

twit.get('application/rate_limit_status', opts, sb(null, logResults));

function logResults(body) {
  debugger;
  console.log(JSON.stringify(body, null, '  '));
}
