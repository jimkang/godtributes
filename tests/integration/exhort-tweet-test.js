var assert = require('assert');
var createExhorter = require('../../exhorter');
var jsonfile = require('jsonfile');
var tributeDemander = require('../../tributedemander');
var chroniclerclient = require('../../chroniclerclient');
var behavior = require('../../behaviorsettings');
var tweetAnalyzer = require('../../tweetanalyzer');
var nounfinder = require('../../nounfinder');
var figurePicker = require('../../figurepicker');
var prepPhrasePicker = require('../../prepphrasepicker');
var isEmoji = require('is-emoji');

var exhorterOpts = {
	chronicler: chroniclerclient.getDb(),
	behavior: behavior,
	logger: console,
	tweetAnalyzer: tweetAnalyzer,
	nounfinder: nounfinder,
	tributeDemander: tributeDemander,
	prepPhrasePicker: prepPhrasePicker,
	figurePicker: figurePicker,
	decorateWithEmojiOpts: function decorateWithEmojiOpts(demandOpts) {
	  if (isEmoji(demandOpts.topic)) {
	    demandOpts.isEmoji = true;
	    demandOpts.repeatNTimesToPluralize = 
	      probable.roll(3) + probable.roll(3) + 2;
	  }
	  return demandOpts;
	},
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

exhorter.exhortationForTweet(
	targetTweet,
	function checkResult(error, tweet, exhortation) {
		console.log('error:', error);
		assert.ok(!error);
		assert.ok(exhortation);
		console.log(exhortation);
		process.exit();		
	}
);
