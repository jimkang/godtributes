/* global process */

var Twit = require('twit');
var config = require('./config');
var createWordnok = require('wordnok').createWordnok;
var tributeDemander = require('./tributedemander');
var figurepicker = require('./figurepicker');
var prepphrasepicker = require('./prepphrasepicker');
var logger = require('./logger');
var emojiSource = require('emojisource');
var behavior = require('./behaviorsettings');
var probable = require('probable');
var callNextTick = require('call-next-tick');
var _ = require('lodash');
var canonicalizer = require('canonicalizer');
var createNounfinder = require('nounfinder');
var translator = require('./translator');
var relevantRelatedWordTypes = require('./relevant-related-word-types');
var GetWord2VecNeighbors = require('./get-w2v-neighbors');
// require('longjohn');

var StaticWebArchiveOnGit = require('static-web-archive-on-git');
var queue = require('d3-queue').queue;
var randomId = require('idmaker').randomId;

var staticWebStream = StaticWebArchiveOnGit({
  config: config.github,
  title: config.archiveName,
  footerHTML: `<footer>
  Banner by <a href="https://twitter.com/metroidbaby">@metroidbaby</a>.
  Powered by <a href="http://developer.wordnik.com/">Wordnik</a>.
  On Twitter: <a href="https://twitter.com/godtributes">@godtributes</a>.
</footer>
<script type="text/javascript">
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-49491163-1', 'jimkang.com');
  ga('send', 'pageview');
</script>`,
  maxEntriesPerPage: 50
});

var twit = new Twit(config.twitter);

var simulationMode = false;
var switches = process.argv.slice(2);
var overridePrimaryTopics;
var postfix;
var disallowSecondary = false;

switches.forEach(parseNextSwitch);

function parseNextSwitch(switchToken) {
  if (switchToken === '--simulate') {
    simulationMode = true;
  } else if (switchToken === '--disallow-secondary') {
    disallowSecondary = true;
  } else if (switchToken.startsWith('postfix:')) {
    postfix = switchToken.replace('postfix:', '');
  } else {
    if (switchToken.indexOf('|') !== -1) {
      overridePrimaryTopics = switchToken.split('|');
    } else {
      overridePrimaryTopics = [switchToken];
    }
  }
}

logger.info('Tribute maker is running.');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey,
  logger: {
    log: logger.info
  }
});

var nounfinder = createNounfinder({
  wordnikAPIKey: config.wordnikAPIKey
});

var isEmojiTopic = false;

var maxCommonnessForSecondary =
  behavior.maxCommonnessForReplyTopic[0] +
  probable.roll(
    behavior.maxCommonnessForSecondaryTopic[1] -
      behavior.maxCommonnessForSecondaryTopic[0]
  );

var primaryTopic;
var primaryDemand;

// TODO: Chain these with async.waterfall. Or refactor exhorter to handle both
// kinds of tributes.

function postTribute() {
  if (overridePrimaryTopics) {
    console.log('Picking from overrides:', overridePrimaryTopics);
    postOnTopic(null, probable.pickFromArray(overridePrimaryTopics));
  } else if (probable.roll(100) < behavior.emojiThresholdPercentage) {
    isEmojiTopic = true;
    postOnTopic(null, emojiSource.getRandomTopicEmoji());
  } else {
    wordnok.getTopic(postOnTopic);
  }
}

function postOnTopic(error, topic) {
  if (error) {
    logger.error(error);
    process.exit();
  }

  var forms = canonicalizer.getSingularAndPluralForms(topic);

  primaryTopic = forms[0];
  primaryDemand = getPrimaryDemand(primaryTopic, isEmojiTopic);

  if (isEmojiTopic || disallowSecondary) {
    callNextTick(makeDemands);
    return;
  }

  getPotentialSecondaryTopics(primaryTopic, makeDemands);
}

function getPotentialSecondaryTopics(primaryTopic, done) {
  if (probable.roll(2) === 0) {
    wordnok.getRelatedWords({ word: primaryTopic }, done);
  } else {
    var getWord2VecNeighbors = GetWord2VecNeighbors({
      nounfinder: nounfinder,
      probable: probable,
      wordnok: wordnok
    });
    getWord2VecNeighbors([primaryTopic], done);
  }
}

function makeDemands(relatedWordsError, relatedWords) {
  var tweetText = primaryDemand;

  if (relatedWordsError) {
    logger.error(relatedWordsError);
    process.exit();
  } else {
    getSecondaryDemand(relatedWords, appendDemandToTweet);
  }

  function appendDemandToTweet(error, secondaryDemand) {
    if (error) {
      logger.error(error);
      // An error is OK here. We can keep going.
    }

    if (secondaryDemand) {
      tweetText += '! ' + secondaryDemand;
    }

    if (probable.roll(10) === 0) {
      translator.translateToRandomLocale(tweetText, 'en', tweetTranslation);
    } else {
      callNextTick(postToTargets, tweetText);
    }

    function tweetTranslation(error, translation) {
      if (error) {
        logger.error(error);
        postToTargets(tweetText);
      } else {
        postToTargets(translation);
      }
    }
  }
}

function postToTargets(text) {
  if (postfix) {
    text += ' ' + postfix;
  }
  if (simulationMode) {
    console.log('Would have tweeted:', text);
  } else {
    console.log('Posting', text);
    var q = queue();
    q.defer(postTweet, text);
    q.defer(postToArchive, text);
    q.awaitAll(wrapUp);
  }
}

function postTweet(text, done) {
  var body = {
    status: text
  };
  twit.post('statuses/update', body, reportTweetResult);

  function reportTweetResult(error, reply) {
    if (error) {
      logger.info(error);
    }
    logger.info(new Date().toString(), 'Tweet posted', reply.text);
    done();
  }
}

function postToArchive(text, done) {
  var id = 'tribute-' + randomId(8);
  staticWebStream.write({
    id,
    date: new Date().toISOString(),
    caption: text
  });
  staticWebStream.end(done);
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

function getSecondaryDemand(relatedWords, done) {
  if (relatedWords) {
    if (typeof relatedWords === 'object' && !Array.isArray(relatedWords)) {
      var relevantLists = _.values(
        _.pick(relatedWords, relevantRelatedWordTypes)
      );

      if (relevantLists.length > 0) {
        var topics = _.flatten(relevantLists);
        nounfinder.getNounsFromWords(topics, filterForInterestingness);
      } else {
        callNextTick(done);
      }
    } else {
      assembleSecondaryDemand(null, relatedWords.filter(notPrimaryTopic));
    }
  } else {
    // Fell through? Call back with nothing.
    callNextTick(done);
  }

  function filterForInterestingness(error, nouns) {
    if (error) {
      done(error);
    } else {
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
    } else {
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

function notPrimaryTopic(word) {
  return word !== primaryTopic;
}

function wrapUp(error) {
  if (error) {
    console.log(error);
  } else {
    console.log('Posted tribute!');
  }
}

postTribute();
