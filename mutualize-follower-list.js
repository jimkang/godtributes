var quidprofollow = require('quidprofollow');
var config = require('./config');
var twitterjerkdetector = require('twitterjerkdetector');
var Twit = require('twit');
var callNextTick = require('call-next-tick');

console.log('mutualize-follower-list is running.');

quidprofollow(
  {
    twitterAPIKeys: config.twitter,
    followFilter: twitterjerkdetector.createFilter({
      twit: new Twit(config.twitter)
    }),
    retainFilter: keepSpecialUsers
  },
  function done(error, followed, unfollowed) {
    if (error) {
      console.log(error);
    }
    console.log('Followed:', followed);
    console.log('Unfollowed:', unfollowed);
  }
);

var specialUsers = [
  2205976656
];

function idIsInSpecialUsers(id) {
  return specialUsers.indexOf(id) !== -1;
}

function keepSpecialUsers(userIds, done) {
  var retainUsers = userIds.filter(idIsInSpecialUsers);
  callNextTick(done, null, retainUsers);
}
