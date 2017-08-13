#!/usr/bin/env node

/* global process __dirname */

var Twit = require('twit');
var config = require('./config');
var createExhorter = require('./exhorter');
var tributeDemander = require('./tributedemander');
var Chronicler = require('basicset-chronicler').createChronicler;
var behavior = require('./behaviorsettings');
var canIChimeIn = require('can-i-chime-in')({
  extraWordsToAvoid: [
    'fascist',
    'fascism',
    'internment',
    'supremacy',
    'supremacist',
    'nazi',
    'nazis',
    'autistic',
    'palsy'
  ]
});
var createNounfinder = require('nounfinder');
var figurePicker = require('./figurepicker');
var prepPhrasePicker = require('./prepphrasepicker');
var probable = require('probable');
var log = require('./logger').info;

var dryRun = (process.argv[2] === '--dry');

if (dryRun) {
  require('longjohn');
}

log('The exhortation server is running.');

var chronicler = Chronicler({
  dbLocation: __dirname + '/data/tributes.db'
});

var nounfinder = createNounfinder({
  wordnikAPIKey: config.wordnikAPIKey
});

var twit = new Twit(config.twitter);
var stream = twit.stream('user');

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
  chronicler: chronicler,
  behavior: behavior,
  canIChimeIn: canIChimeIn,
  nounfinder: nounfinder,
  tributeDemander: tributeDemander,
  prepPhrasePicker: prepPhrasePicker,
  figurePicker: figurePicker,
  decorateWithEmojiOpts: tributeDemander.decorateWithEmojiOpts,
  maxCommonnessForTopic: maxCommonnessForTopic,
  maxCommonnessForImageTopic: maxCommonnessForImageTopic,
  // TODO: Make this a function that does a coin flip to decide if this should 
  // be 1 or 2 per instance.
  nounCountThreshold: 1,
  w2vNeighborChance: behavior.w2vNeighborChance
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
      if (dryRun) {
        console.log('\n');
        console.log('TWEET', tweet.text);
        console.log('RESPONSE', exhortation);
        console.log('\n');
      }
      else {
        twit.post(
          'statuses/update',
          {
            status: exhortation,
            in_reply_to_status_id: tweet.id_str
          },
          function recordTweetResult(error) {
            if (error) {
              log(error);
            }
            else {
              recordReplyDetails(tweet, topics);
              log('Replied to status', tweet.text, 'with :', exhortation);
            }
          }
        );
      }
    },
    // Vary the delay until the response from 0 to 30 seconds.
    probable.roll(6) * 5 * 1000);
  }
}

function recordReplyDetails(targetStatus, topics) {
  var userId = targetStatus.user.id_str;
  chronicler.recordThatTweetWasRepliedTo(targetStatus.id_str);
  chronicler.recordThatUserWasRepliedTo(userId);
  topics.forEach(function recordTopic(topic) {
    chronicler.recordThatTopicWasUsedInReplyToUser(topic, userId);
  });
}

