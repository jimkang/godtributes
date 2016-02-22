var Twit = require('twit');
var config = require('../config');
var sb = require('standard-bail')({
  log: console.log
});

var twit = new Twit(config.twitter);

var opts = {
  resources: 'followers,friends,users'
};

twit.get('application/rate_limit_status', opts, sb(logResults));

function logResults(body) {
  console.log(JSON.stringify(body, null, '  '));
}
