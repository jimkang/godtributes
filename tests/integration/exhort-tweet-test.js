var test = require('tape');
var createExhorter = require('../../exhorter');
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
  dbLocation: 'exhort-integration-test.db'
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
  user: {
    id: 546402627261833217,
    id_str: '546402627261833217',
    screen_name: 'deathmtn'
  },
  text: "Trader Joe's has cheap persimmons again! https://flic.kr/p/qcTcz2"
};
var targetTweet2 = {
  user: {
    id: 546402627261833217,
    id_str: '546402627261833217',
    screen_name: 'deathmtn'
  },
  text:
    'The news about Kate Spade is dreadful. She left a 13-year old daughter behind! Her husband Andy’s stepfather committed suicide when he and his brothers (Bryan & David- yes, that one) were still kids, too. So much awfulness.'
};

var testCases = [
  {
    name: 'Respond to tweet',
    shouldRespond: true,
    tweet: targetTweet
  },
  {
    name: 'Do not respond to tweet',
    shouldRespond: false,
    tweet: targetTweet2
  }
];

testCases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, exhortationTest);

  function exhortationTest(t) {
    exhorter.getExhortationForTweet(testCase.tweet, checkResult);

    function checkResult(error, tweet, exhortation, topics) {
      console.log('error:', error);
      if (testCase.shouldRespond) {
        t.ok(!error);
        t.ok(exhortation);
        t.ok(Array.isArray(topics));
        console.log(exhortation);
      } else {
        t.ok(error);
      }
      t.end();
    }
  }
}
