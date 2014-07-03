var Twit = require('twit');
var config = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');
var probable = require('probable');
var _ = require('lodash');
var queue = require('queue-async');
var nounfinder = require('./nounfinder');
var figurepicker = require('./figurepicker');
var recordkeeper = require('./recordkeeper');
var behavior = require('./behaviorsettings');
var logger = require('./logger');

var simulationMode = (process.argv[2] === '--simulate');
var onlyTargetTestSubject = (process.argv[2] === '--onlytestsubject');

var twit = new Twit(config.twitter);

logger.log('Exhort is running.');

function exhort() {
  if (onlyTargetTestSubject) {
    exhortUser(behavior.exhortTestSubjectUserId);
  }
  else {
    twit.get('followers/ids', function exhortFollowers(error, response) {
      if (error) {
        handleError(error);
      }
      else {
        var usersToExhort = response.ids;
        logger.log('Found followers:', usersToExhort);
        usersToExhort.forEach(exhortUser);
      }
    });
  }
}

function exhortUser(userId) {
  recordkeeper.whenWasUserLastRepliedTo(userId.toString(),
    function exhortIfNotTooSoon(error, lastReplyDate) {
      if (error) {
        // Never replied to, we assume.
        replyToUserStatuses(userId);
      }
      else {
        var hoursElapsed = 
          (Date.now() - lastReplyDate.getTime()) / (60 * 60 * 1000);
        if (hoursElapsed > behavior.hoursToWaitBetweenRepliesToSameUser) {
          replyToUserStatuses(userId);
        }
        else {
          logger.log('Not replying to ', userId, '; last replied', 
            hoursElapsed, 'hours ago.');
        }
      }
    }
  );
}

function replyToUserStatuses(userId) {
  twit.get('statuses/user_timeline/:user_id', {
    user_id: userId
  },
  tweetRepliesToStatuses);  
}

function tweetRepliesToStatuses(error, response) {
  if (error) {
    logger.log(error);
    return;
  }

  var notGodTributesRTs = response.filter(isNotARetweetOfSelf);
  var nonReplies = notGodTributesRTs.filter(isNotAReply);
  nonReplies = _.sample(nonReplies, ~~(nonReplies.length/3));

  // TODO: Break up this mess.

  filterStatusesForInterestingNouns(nonReplies, 
    function useNounsToReply(error, nounGroups) {
      if (error) {
        logger.log(error);
      }
      else {
        nounGroups = nounGroups.slice(0, 
          behavior.maxAttemptsToReplyPerUserPerRun
        );
        nounGroups.forEach(function replyIfTheresEnoughMaterial(nounGroup, i) {
          var statusBeingRepliedTo = nonReplies[i];
          // If these nouns have already been used as topics in replies to this 
          // users, do not reply.
          var q = queue();
          nounGroup.forEach(function queueNounRecordCheck(noun) {
            q.defer(recordkeeper.topicWasUsedInReplyToUser, noun, 
              statusBeingRepliedTo.user.id_str
            );
          });
          q.awaitAll(function checkIfNounsWereUsed(error, usedFlags) {
            if (!usedFlags.every(_.identity)) {
              logger.log('Already used one of these topics -', nounGroup, 
                'for this user:', statusBeingRepliedTo.user.id_str);
              return;
            }

            // If there's two nouns, definitely do it. If there's one, it's a 
            // coin flip.
            if (nounGroup.length > 0 && probable.roll(2) < nounGroup.length) {

              recordkeeper.tweetWasRepliedTo(statusBeingRepliedTo.id_str, 
                function replyIfFirstTime(error, didReply) {
                  if (!didReply) {
                    replyToStatusWithNouns(statusBeingRepliedTo, nounGroup);
                  }
                  else {
                    logger.log('Already replied to ', statusBeingRepliedTo.text);
                  }
                }
              );
            }
          });
        });
      }
    }
  );
}

function filterStatusesForInterestingNouns(statuses, done) {
  var texts = _.pluck(statuses, 'text');
  var q = queue();
  texts.forEach(function addToQueue(text) {
    q.defer(getReplyNounsFromText, text);
  });
  q.awaitAll(done);
}

// Assumes nouns has at least one element.
function replyToStatusWithNouns(status, nouns) {
  var selectedNouns = _.sample(nouns, 2);
  debugger;
  var primaryTribute = tributeDemander.makeDemandForTopic({
    topic: selectedNouns[0],
    tributeFigure: figurepicker.getMainTributeFigure()    
  });

  var secondaryTribute;

  if (selectedNouns.length > 1) {
    secondaryTribute = tributeDemander.makeDemandForTopic({
      topic: selectedNouns[1],
      tributeFigure: figurepicker.getSecondaryTributeFigure()
    });
  }

  var replyText = '@' + status.user.screen_name + ' ' + primaryTribute;
  if (secondaryTribute) {
    replyText += ('! ' + secondaryTribute);
  }
  // logger.log('Replying to status', status.text, 'with :', replyText);
  if (simulationMode) {
    logger.log('Would have posted:', replyText, 'In reply to:', status.id);
    recordReplyDetails(status, selectedNouns.slice(0, 2));

    return;
  }
  twit.post('statuses/update', {
      status: replyText, 
      in_reply_to_status_id: status.id_str
    },
    function recordTweetResult(error, reply) {
      recordReplyDetails(status, selectedNouns.slice(0, 2));
      logger.log('Replied to status', status.text, 'with :', replyText);      
    }
  );

}

function recordReplyDetails(targetStatus, topics) {
  var userId = targetStatus.user.id_str;
  recordkeeper.recordThatTweetWasRepliedTo(targetStatus.id_str);
  recordkeeper.recordThatUserWasRepliedTo(userId);
  topics.forEach(function recordTopic(topic) {
    recordkeeper.recordThatTopicWasUsedInReplyToUser(topic, userId);
  });
}

function getReplyNounsFromText(text, done) {
  nounfinder.getNounsFromText(text, function filterReplyNouns(error, nouns) {
    if (error) {
      logger.log(error);
    }
    else {
      if (nouns.length > 0) {
        nounfinder.filterNounsForInterestingness(nouns, 34, done);
      }
      else {
        done(null, []);
      }
    }
  });
}

function isNotAReply(status) {
  return !status.in_reply_to_user_id && !status.in_reply_to_status_id && 
    !status.in_reply_to_screen_name;
}

function isNotARetweetOfSelf(status) {
  var isRTOfSelf = 
    (status.retweeted_status && 
     status.retweeted_status.user.screen_name === 'godtributes') ||
    status.text.indexOf('RT @godtributes') !== -1 ||
    status.text.indexOf('"@godtributes') !== -1 ||
    status.text.indexOf('\u201C@godtributes') !== -1;
    
  // if (isRTOfSelf) {
  //   logger.log('Found RT of self:', status.text);
  // }
  return !isRTOfSelf;
}

function handleError(error) {
  logger.log('Response status:', error.statusCode);
  logger.log('Data:', error.data);
}

exhort();
