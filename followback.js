var Twit = require('twit');
var config = require('./config');
var _ = require('lodash');
var queue = require('queue-async');
var behavior = require('./behaviorsettings');
var logger = require('./logger');

var simulationMode = (process.argv[2] === '--simulate');
var onlyTargetTestSubject = (process.argv[2] === '--onlytestsubject');

var twit = new Twit(config.twitter);

logger.log('followback is running.');

function followback() {
  if (onlyTargetTestSubject) {
    followUser(behavior.exhortTestSubjectUserId);
  }
  else {
    var q = queue();
    q.defer(twit.get.bind(twit), 'followers/ids');
    q.defer(twit.get.bind(twit), 'friends/ids');
    q.await(function followFriendsThatHaventBeenFollowed(error, 
      followerResponse, friendResponse) {

      if (error) {
        handleError(error);
      }
      else {
        var followers = followerResponse.ids;
        var friends = friendResponse.ids;
        console.log('Found followers', followers, 'and friends', friends);
        var unfollowedFriends = _.without.apply(_, 
          [followers].concat(friends)
        );
        logger.log('Going to follow', unfollowedFriends);
        if (!simulationMode) {
          unfollowedFriends.forEach(followUser);
        }
      }
    });
  }
}

function followUser(userId) {
  twit.post('friendships/create', {id: userId}, handleError);
}

function handleError(error) {
  if (error) {
    logger.log('Response status', error.statusCode);
    logger.log('Data', error.data);
  }
}

followback();
