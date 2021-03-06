/* global process */

var config = require('./config');
var createWordnok = require('wordnok').createWordnok;
var tributeDemander = require('./tributedemander');
var figurepicker = require('./figurepicker');
var prepphrasepicker = require('./prepphrasepicker');
var emojiSource = require('emojisource');
var behavior = require('./behaviorsettings');
var probable = require('probable');
var callNextTick = require('call-next-tick');
var _ = require('lodash');
var canonicalizer = require('canonicalizer');
var createNounfinder = require('nounfinder');
//var translator = require('./translator');
var relevantRelatedWordTypes = require('./relevant-related-word-types');
//var GetWord2VecNeighbors = require('./get-w2v-neighbors');
var postIt = require('@jimkang/post-it');
var oknok = require('oknok');

// require('longjohn');

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

console.log('Tribute maker is running.');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey
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
    getTopic(postOnTopic);
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

  if (isEmojiTopic || disallowSecondary) {
    callNextTick(makeDemands);
    return;
  }

  getPotentialSecondaryTopics(primaryTopic, makeDemands);
}

function getPotentialSecondaryTopics(primaryTopic, done) {
  //if (probable.roll(2) === 0) {
  wordnok.getRelatedWords({ word: primaryTopic }, done);
  //} else {
  //var getWord2VecNeighbors = GetWord2VecNeighbors({
  //nounfinder: nounfinder,
  //probable: probable,
  //wordnok: wordnok
  //});
  //getWord2VecNeighbors([primaryTopic], done);
  //}
}

function makeDemands(relatedWordsError, relatedWords) {
  var postText = primaryDemand;

  if (relatedWordsError) {
    console.log(relatedWordsError);
    process.exit();
  } else {
    getSecondaryDemand(relatedWords, appendDemandToTweet);
  }

  function appendDemandToTweet(error, secondaryDemand) {
    if (error) {
      console.log(error);
      // An error is OK here. We can keep going.
    }

    if (secondaryDemand) {
      postText += '! ' + secondaryDemand;
    }

    //if (probable.roll(10) === 0) {
    //translator.translateToRandomLocale(postText, 'en', postTranslation);
    //} else {
    callNextTick(postToTargets, postText);
    //}

    //function postTranslation(error, translation) {
    //if (error) {
    //console.log(error);
    //postToTargets(postText);
    //} else {
    //postToTargets(translation);
    //}
    //}
  }
}

function postToTargets(text) {
  if (postfix) {
    text += ' ' + postfix;
  }
  text =
    '<img src="https://smidgeo.com/bots/godtributes/images/icon.png" alt="GODTRIBUTES!"> ' +
    text;

  if (simulationMode) {
    console.log('Would have posted:', text);
  } else {
    console.log('Posting', text);
    postIt(
      {
        text,
        targets: [
          {
            type: 'noteTaker',
            config: config.noteTaker
          }
        ]
      },
      wrapUp
    );
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

function getTopic(done) {
  wordnok.getRandomWords({}, oknok({ ok: filterToNouns, nok: done }));

  function filterToNouns(words) {
    nounfinder.getNounsFromWords(
      words,
      oknok({ ok: pickFromNouns, nok: done })
    );
  }

  function pickFromNouns(nouns) {
    done(null, probable.pickFromArray(nouns));
  }
}

function wrapUp(error) {
  if (error) {
    console.log(error);
  } else {
    console.log('Posted tribute!');
  }
}

postTribute();
