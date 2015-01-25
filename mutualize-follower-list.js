var quidprofollow = require('quidprofollow');
var config = require('./config');
var twitterjerkdetector = require('twitterjerkdetector');
var Twit = require('twit');

console.log('mutualize-follower-list is running.');

quidprofollow(
  {
    twitterAPIKeys: config.twitter,
    followFilter: twitterjerkdetector.createFilter({
      twit: new Twit(config.twitter)
    })
  },
  function done(error, followed, unfollowed) {
    if (error) {
      console.log(error);
    }
    console.log('Followed:', followed);
    console.log('Unfollowed:', unfollowed);
  }
);
