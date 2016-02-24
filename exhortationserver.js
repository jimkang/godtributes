var Twit = require('twit');
var config = require('./config');
var createExhorter = require('./exhorter');
var tributeDemander = require('./tributedemander');
var chroniclerclient = require('./chroniclerclient');
var behavior = require('./behaviorsettings');
var tweetAnalyzer = require('./tweetanalyzer');
var createNounfinder = require('nounfinder');
var figurePicker = require('./figurepicker');
var prepPhrasePicker = require('./prepphrasepicker');
var probable = require('probable');
var log = require('./logger').info;

log('The exhortation server is running.');

var nounfinder = createNounfinder({
  wordnikAPIKey: config.wordnikAPIKey,
  memoizeServerPort: 4444,
  onDisconnect: respondToCacheDisconnect
});

var twit = new Twit(config.twitter);
var stream = twit.stream('user');

var db = chroniclerclient.getDb();

var maxCommonnessForTopic = behavior.maxCommonnessForReplyTopic[0] + 
  probable.roll(
    behavior.maxCommonnessForReplyTopic[1] -
    behavior.maxCommonnessForReplyTopic[0]
  );
var maxCommonnessForImageTopic = behavior.maxCommonnessForImageTopic[0] +
  probable.roll(
    behavior.maxCommonnessForImageTopic[1] -
    behavior.maxCommonnessForImageTopic[0]
  );

var exhorterOpts = {
  chronicler: db,
  behavior: behavior,
  tweetAnalyzer: tweetAnalyzer,
  nounfinder: nounfinder,
  tributeDemander: tributeDemander,
  prepPhrasePicker: prepPhrasePicker,
  figurePicker: figurePicker,
  decorateWithEmojiOpts: tributeDemander.decorateWithEmojiOpts,
  maxCommonnessForTopic: maxCommonnessForTopic,
  maxCommonnessForImageTopic: maxCommonnessForImageTopic,
  // TODO: Make this a function that does a coin flip to decide if this should 
  // be 1 or 2 per instance.
  nounCountThreshold: 1
};

log('maxCommonnessForTopic:', maxCommonnessForTopic);
log('maxCommonnessForImageTopic', maxCommonnessForImageTopic);

var exhorter = createExhorter(exhorterOpts);

stream.on('tweet', function respondToTweet(tweet) {
  exhorter.getExhortationForTweet(tweet, tweetExhortation);
});

function tweetExhortation(error, tweet, exhortation, topics) {
  log('exhortation:', exhortation);
  if (error) {
    log('Error from getExhortationForTweet:', error);
  }
  else if (!exhortation || exhortation.length < 1) {
    log(
      'No error, but got nothing from getExhortationForTweet. Tweet:', tweet
    );
  }
  else {
    setTimeout(function doPost() {
      twit.post(
        'statuses/update',
        {
          status: exhortation,
          in_reply_to_status_id: tweet.id_str
        },
        function recordTweetResult(error, reply) {
          recordReplyDetails(tweet, topics);
          log('Replied to status', tweet.text, 'with :', exhortation);      
        }
      );
    },
    // Vary the delay until the response from 0 to 30 seconds.
    probable.roll(6) * 5 * 1000);
  }
}

function recordReplyDetails(targetStatus, topics) {
  var userId = targetStatus.user.id_str;
  db.recordThatTweetWasRepliedTo(targetStatus.id_str);
  db.recordThatUserWasRepliedTo(userId);
  topics.forEach(function recordTopic(topic) {
    db.recordThatTopicWasUsedInReplyToUser(topic, userId);
  });
}

// The safest thing to do when the cache disconnects right now is to exit and 
// let the supervisor process restart us.
function respondToCacheDisconnect() {
  log('Cache disconnected! exhortationserver exiting.');
  process.exit();
}
