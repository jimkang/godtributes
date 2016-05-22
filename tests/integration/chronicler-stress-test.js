var assert = require('assert');
var createExhorter = require('../../exhorter');
var jsonfile = require('jsonfile');
var tributeDemander = require('../../tributedemander');
var Chronicler = require('basicset-chronicler').createChronicler;
var behavior = require('../../behaviorsettings');
var canIChimeIn = require('can-i-chime-in')();
var createNounfinder = require('nounfinder');
var figurePicker = require('../../figurepicker');
var prepPhrasePicker = require('../../prepphrasepicker');
var config = require('../../config');

var nounfinder = createNounfinder({
  wordnikAPIKey: config.wordnikAPIKey
});

var chronicler = Chronicler({
  dbLocation: 'chronicler-stress-test.db'
});

var exhorterOpts = {
  chronicler: chronicler,
  behavior: behavior,
  logger: console,
  canIChimeIn: canIChimeIn,
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
    exhorterOpts.chronicler.getLevelDB().close();
  }
}

runGet();
