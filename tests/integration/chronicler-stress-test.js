var assert = require('assert');
var createExhorter = require('../../exhorter');
var jsonfile = require('jsonfile');
var tributeDemander = require('../../tributedemander');
var chroniclerclient = require('../../chroniclerclient');
var behavior = require('../../behaviorsettings');
var tweetAnalyzer = require('../../tweetanalyzer');
var createNounfinder = require('nounfinder');
var figurePicker = require('../../figurepicker');
var prepPhrasePicker = require('../../prepphrasepicker');
var config = require('../../config');

var nounfinder = createNounfinder({
  wordnikAPIKey: config.wordnikAPIKey,
  memoizeServerPort: 4444
});

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
  maxCommonnessForTopic: 30,
  nounCountThreshold: 1
};

var exhorter = createExhorter(exhorterOpts);

var targetTweet = {
  id_str: '546402627261833217',     
  user: {
    id: 546402627261833200,
    screen_name: 'deathmtn'
  },
  text: 'Trader Joe\'s has cheap persimmons again! https://flic.kr/p/qcTcz2'
};

// Make sure the chronicler server is running before you run this.

var totalIters = 100;
var count = 0;

function runGet() {
  exhorter.getExhortationForTweet(targetTweet, runNextIter);
}

function runNextIter(error, tweet, exhortation, topics) {
  assert.ok(!error);
  assert.ok(exhortation);
  count += 1;
  console.log('Finished iter', count);

  if (count < totalIters) {
    process.nextTick(runGet);
  }
  else {
    exhorterOpts.chronicler.close();
  }
}

runGet();
