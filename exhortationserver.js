var Twit = require('twit');
var config = require('./config');
var createExhorter = require('./exhorter');
var tributeDemander = require('./tributedemander');
var chroniclerclient = require('./chroniclerclient');
var behavior = require('./behaviorsettings');
var tweetAnalyzer = require('./tweetanalyzer');
var nounfinder = require('./nounfinder');
var figurePicker = require('./figurepicker');
var prepPhrasePicker = require('./prepphrasepicker');
var probable = require('probable');

var twit = new Twit(config.twitter);
var stream = twit.stream('user');

var maxCommonnessForTopic = behavior.maxCommonnessForReplyTopic[0] + 
  probable.roll(
    behavior.maxCommonnessForReplyTopic[1] - 
    behavior.maxCommonnessForReplyTopic[0]
  );

var exhorterOpts = {
  chronicler: chroniclerclient.getDb(),
  behavior: behavior,
  logger: console,
  tweetAnalyzer: tweetAnalyzer,
  nounfinder: nounfinder,
  tributeDemander: tributeDemander,
  prepPhrasePicker: prepPhrasePicker,
  figurePicker: figurePicker,
  decorateWithEmojiOpts: tributeDemander.decorateWithEmojiOpts,
  maxCommonnessForTopic: maxCommonnessForTopic,
  // TODO: Make this a function that does a coin flip to decide if this should 
  // be 1 or 2 per instance.
  nounCountThreshold: 1
};

console.log('maxCommonnessForTopic:', maxCommonnessForTopic);

var exhorter = createExhorter(exhorterOpts);

stream.on('tweet', function respondToTweet(tweet) {
  exhorter.getExhortationForTweet(tweet, tweetExhortation);
});

function tweetExhortation(error, tweet, exhortation) {
  console.log('error:', error);
  console.log('exhortation:', exhortation);
  
}

// 1. Get exhortation.
// 2. Record that it's being used in a reply.
// 3. Tweet it.
