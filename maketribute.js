var Bot = require('./node_modules/twit/examples/bot');
var config = require('./config');
var createWordnok = require('wordnok').createWordnok;
var tributeDemander = require('./tributedemander');
var figurepicker = require('./figurepicker');
var prepphrasepicker = require('./prepphrasepicker');
var logger = require('./logger');
var handleTwitterError = require('./handletwittererror');
var chroniclerclient = require('./chroniclerclient');
var emojiSource = require('emojisource');
var behavior = require('./behaviorsettings');
var probable = require('probable');
var callBackOnNextTick = require('conform-async').callBackOnNextTick;
var _ = require('lodash');
var canonicalizer = require('canonicalizer');
var createNounfinder = require('nounfinder');

var bot = new Bot(config.twitter);

var simulationMode = (process.argv[2] === '--simulate');

logger.log('Tribute maker is running.');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey,
  logger: logger,
  memoizeServerPort: 4444
});

var db = chroniclerclient.getDb();

var isEmojiTopic = false;

var maxCommonnessForSecondary = behavior.maxCommonnessForReplyTopic[0] +
  probable.roll(
    behavior.maxCommonnessForSecondaryTopic[1] -
    behavior.maxCommonnessForSecondaryTopic[0]
  );

var primaryTopic;
var primaryDemand;

// TODO: Chain these with async.waterfall. Or refactor exhorter to handle both
// kinds of tributes.

function postTribute() {
  if (probable.roll(100) < behavior.emojiThresholdPercentage) {
    isEmojiTopic = true;
    postOnTopic(null, emojiSource.getRandomTopicEmoji());
  }
  else {
    wordnok.getTopic(postOnTopic);
  }
}

function postOnTopic(error, topic) {
  if (error) {
    console.log(error);
    process.exit();
  }

  var forms = canonicalizer.getSingularAndPluralForms(topic);

  primaryTopic = forms[0];
  primaryDemand = getPrimaryDemand(primaryTopic, isEmojiTopic);

  if (isEmojiTopic) {
    callBackOnNextTick(makeDemands);
    return;
  }

  wordnok.getRelatedWords(
    {
      word: primaryTopic
    },
    makeDemands
  );
}

function makeDemands(relatedWordsError, relatedWords) {
  var tweetText = primaryDemand;

  if (relatedWordsError) {
    console.log(relatedWordsError);
    process.exit();
  }
  else {
    getSecondaryDemand(relatedWords, appendDemandToTweet);
  }

  function appendDemandToTweet(error, secondaryDemand) {
    if (error) {
      console.log(error);
      // An error is OK here. We can keep going.
    }

    if (secondaryDemand) {
      tweetText += ('! ' + secondaryDemand);
    }
    callBackOnNextTick(tweetAndRecord, tweetText);
  }
}

function tweetAndRecord(tweetText) {
  if (simulationMode) {
    logger.log('Would have tweeted', tweetText);
    cleanUp();
  }
  else {
    bot.tweet(tweetText, function reportTweetResult(error, reply) {
      logger.log((new Date()).toString(), 'Tweet posted', reply.text);
      db.recordThatTopicWasUsedInTribute(primaryTopic, cleanUp);
    });
  }
}

function cleanUp() {
  db.close();
  process.exit();
}

function getPrimaryDemand(topic, isEmoji) {
  var opts = {
    topic: topic,
    prepositionalPhrase: prepphrasepicker.getPrepPhrase(),
    tributeFigure: figurepicker.getMainTributeFigure(),
    isEmoji: isEmoji
  };

  if (isEmoji) {
    opts.repeatNTimesToPluralize = probable.roll(4) + probable.roll(4) + 2;
  }

  return tributeDemander.makeDemandForTopic(opts);
}

var relevantRelatedWordTypes = [
  'synonym',
  'hypernym',
  'hyponym',
  'same-context',
  'etymologically-related-term',
  'unknown'
];

function getSecondaryDemand(relatedWords, done) {
  var nounfinder;

  if (relatedWords) {
    var relevantLists = _.values(_.pick(
      relatedWords, relevantRelatedWordTypes
    ));

    if (relevantLists.length > 0) {
      var topics = _.flatten(relevantLists);
      nounfinder = createNounfinder({
        wordnikAPIKey: config.wordnikAPIKey,
        memoizeServerPort: 4444
      });

      // TODO: Add nounfinder method that takes an array of words.
      nounfinder.getNounsFromText(topics.join(' '), filterForInterestingness);
      return;
    }
  }

  // Fell through? Call back with nothing.
  callBackOnNextTick(done);

  function filterForInterestingness(error, nouns) {
    if (error) {
      done(error);
    }
    else {
      nounfinder.filterNounsForInterestingness(
        nouns,
        maxCommonnessForSecondary,
        assembleSecondaryDemand
      );
    }
  }

  function assembleSecondaryDemand(error, nouns) {
    if (error) {
      done(error);
    }
    else {
      var demand;
      if (nouns.length > 0) {
        demand = tributeDemander.makeDemandForTopic({
          topic: probable.pickFromArray(nouns),
          prepositionalPhrase: prepphrasepicker.getPrepPhrase(),
          tributeFigure: figurepicker.getSecondaryTributeFigure()
        });
      }
      done(error, demand);
    }
  }
}

postTribute();
