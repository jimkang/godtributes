var Twit = require('twit');
var config = require('./config');
var _ = require('lodash');
var queue = require('queue-async');
var behavior = require('./behaviorsettings');
var logger = require('./logger');

var simulationMode = (process.argv[2] === '--simulate');
var onlyTargetTestSubject = (process.argv[2] === '--onlytestsubject');

var twit = new Twit(config.twitter);

logger.log('prune is running.');

function prune() {
  if (onlyTargetTestSubject) {
    unfollowUser(behavior.exhortTestSubjectUserId);
  }
  else {
    var q = queue();
    q.defer(twit.get.bind(twit), 'followers/ids');
    q.defer(twit.get.bind(twit), 'friends/ids');
    q.await(function unfollowNonMutuals(error, 
      followerResponse, friendResponse) {

      if (error) {
        handleError(error);
      }
      else {
        var followers = followerResponse.ids;
        var friends = friendResponse.ids;
        console.log('Found followers', followers, 'and friends', friends);
        var nonMutuals = _.without.apply(_, [friends].concat(followers));
        logger.log('Going to unfollow', nonMutuals);
        if (!simulationMode) {
          nonMutuals.forEach(unfollowUser);
        }
      }
    });
  }
}

function unfollowUser(userId) {
  twit.post('friendships/destroy', {id: userId}, handleError);
}

function handleError(error) {
  if (error) {
    logger.log('Response status', error.statusCode);
    logger.log('Data', error.data);
  }
}

prune();
