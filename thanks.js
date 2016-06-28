var Bot = require('./node_modules/twit/examples/bot');
var config = require('./config');
var createWordnok = require('wordnok').createWordnok;
var tributeDemander = require('./tributedemander');
var figurepicker = require('./figurepicker');
var prepphrasepicker = require('./prepphrasepicker');
var logger = require('./logger');
var handleTwitterError = require('./handletwittererror');
var emojiSource = require('emojisource');
var behavior = require('./behaviorsettings');
var probable = require('probable');
var callNextTick = require('call-next-tick');
var _ = require('lodash');
var canonicalizer = require('canonicalizer');
var createNounfinder = require('nounfinder');
var translator = require('./translator');
var pickThanksTopic = require('./pick-thanks-topic');
var relevantRelatedWordTypes = require('./relevant-related-word-types');

var bot = new Bot(config.twitter);

var simulationMode = (process.argv[2] === '--simulate');

logger.info('Thanks maker is running.');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey,
  logger: {
    log: logger.info
  }
});

var isEmojiTopic = false;

var maxCommonnessForSecondary = behavior.maxCommonnessForReplyTopic[0] +
  probable.roll(
    behavior.maxCommonnessForSecondaryTopic[1] -
    behavior.maxCommonnessForSecondaryTopic[0]
  );

((((function go() {
  behavior.visionDonors.forEach(postThanksTribute);

  postThanksTribute(
    'https://www.patreon.com/deathmtn',
    {
      'same-context': [
        'vision',
        'aesthesis',
        'sight',
        'eyesight',
        'perception',
        'eyes'
      ]
    }
  );
})())));

function postThanksTribute(prefix, secondaryTopicPool) {
  var primaryTopic;
  var primaryDemand;

  postOnTopic(null, pickThanksTopic());

  function postOnTopic(error, topic) {
    if (error) {
      logger.error(error);
      process.exit();
    }

    var forms = canonicalizer.getSingularAndPluralForms(topic);

    primaryTopic = forms[0];
    primaryDemand = getPrimaryDemand(primaryTopic, false);

    if (secondaryTopicPool) {
      makeDemands(null, secondaryTopicPool);
    }
    else {
      wordnok.getRelatedWords(
        {
          word: primaryTopic
        },
        makeDemands
      );
    }
  }

  function makeDemands(relatedWordsError, relatedWords) {
    var tweetText = prefix + ' ' + primaryDemand;

    if (relatedWordsError) {
      logger.error(relatedWordsError);
      process.exit();
    }
    else {
      getSecondaryDemand(relatedWords, appendDemandToTweet);
    }

    function appendDemandToTweet(error, secondaryDemand) {
      if (error) {
        logger.error(error);
        // An error is OK here. We can keep going.
      }

      if (secondaryDemand) {
        tweetText += ('! ' + secondaryDemand);
      }
      
      callNextTick(tweet, tweetText);
    }
  }
}

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
      });

      nounfinder.getNounsFromText(topics.join(' '), filterForInterestingness);
      return;
    }
  }

  // Fell through? Call back with nothing.
  callNextTick(done);

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

function tweet(tweetText) {
  if (simulationMode) {
    console.log('Would have tweeted', tweetText);
  }
  else {
    bot.tweet(tweetText, function reportTweetResult(error, reply) {
      logger.info((new Date()).toString(), 'Tweet posted', reply.text);
    });
  }
}
