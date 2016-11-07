var StandardError = require('standard-error');
var async = require('async');
var queue = require('queue-async');
var callNextTick = require('call-next-tick');
var _ = require('lodash');
var betterKnow = require('better-know-a-tweet');
var translator = require('./translator');
var defaultProbable = require('probable');
var knownLanguages = require('./data/known-translator-languages');
var getImagesFromTweet = require('get-images-from-tweet');
var AnalyzeTweetImages = require('./analyze-tweet-images');
var sb = require('standard-bail')();
var log = require('./logger').info;
var GetWord2VecNeighbors = require('./get-w2v-neighbors');
var iscool = require('iscool')();
var config = require('./config');

var createWordnok = require('wordnok').createWordnok;

var wordnok =  createWordnok({
  apiKey: config.wordnikAPIKey
});

function createExhorter(opts) {
  var chronicler = opts.chronicler;
  var behavior = opts.behavior;
  var canIChimeIn = opts.canIChimeIn;
  var nounfinder = opts.nounfinder;
  var maxCommonnessForTopic = opts.maxCommonnessForTopic;
  var maxCommonnessForImageTopic = opts.maxCommonnessForImageTopic;
  var nounCountThreshold = opts.nounCountThreshold;
  var tributeDemander = opts.tributeDemander;
  var prepPhrasePicker = opts.prepPhrasePicker;
  var figurePicker = opts.figurePicker;
  var decorateWithEmojiOpts = opts.decorateWithEmojiOpts;
  var probable = opts.probable;
  var w2vNeighborChance = opts.w2vNeighborChance ? opts.w2vNeighborChance : 0;

  if (!probable) {
    probable = defaultProbable;
  }

  var analyzeTweetImagesOpts = {};
  if (opts.getImageAnalysis) {
    analyzeTweetImagesOpts.getImageAnalysis = opts.getImageAnalysis;
  }
  var analyzeTweetImages = AnalyzeTweetImages(analyzeTweetImagesOpts);

  var getWord2VecNeighbors = GetWord2VecNeighbors({
    nounfinder: nounfinder,
    probable: probable,
    wordnok: wordnok
  });

  function getExhortationForTweet(tweet, exhortationDone) {

    //                           +|
    //                  WHOA!   ++|
    //                       \ +++|
    //                        ++++|
    //                            |
    //                       vvvvvvvvvv
    //                        vvvvvvvv
    //                           +-++---------
    //                         o | ||   || |
    //                         | ||   || |
    //                       | ||   || |
    //                    +-+-----+++-+
    //                   o| || || |
    //                  | || || |
    //                  | || || o
    //                +--++-+++o+
    //              | || || || |
    //              | || || || | o
    //           o  |o|| || || o
    //            oo  o  || || |
    //        ooo   o o  |o || |

    // Each step in the waterfall passes the tweet (plus anything else 
    // necessary) to the next step.
    // If any step returns an error, we bail on generating an exhortation.

    async.waterfall(
      [
        waterfallKickoff,
        isNotTweetOfSelf,
        isNotARetweetOfSelf,
        checkThatTweetWasNotRepliedTo,        
        findLastReplyDateForUser,
        replyDateWasNotTooRecent,
        statusContainsTextThatIsOKToReplyTo,
        getNounsFromTweet,
        filterToNouns,
        filterOutOldNouns,
        maybeGetNearestNeighborNouns,
        checkThatNounThresholdIsMet,
        makeExhortationFromNouns
      ],
      finalDone
    );

    function waterfallKickoff(done) {
      callNextTick(done, null, tweet);
    }

    function finalDone(error, tweet, exhortation, topics) {
      if (error) {
        exhortationDone(error);
      }
      else {
        exhortationDone(error, tweet, exhortation, topics);
      }
    }
  }

  function findLastReplyDateForUser(tweet, done) {
    chronicler.whenWasUserLastRepliedTo(
      tweet.user.id.toString(), function passLastReplyDate(error, date) {
        // Don't pass on the error – `whenWasUserLastRepliedTo` can't find a
        // key, it returns a NotFoundError. For us, that's expected.
        if (error && error.type === 'NotFoundError') {
          error = null;
          date = new Date(0);
        }
        done(error, tweet, date);
      }
    );
  }

  function checkThatTweetWasNotRepliedTo(tweet, done) {
    chronicler.tweetWasRepliedTo(
      tweet.user.id.toString(), function stopIfReplied(error, wasRepliedTo) {
        var error;

        if (wasRepliedTo) {
          error = createErrorForTweet(tweet, {
            message: 'Tweet was already replied to.',
          });
        }
        else {
          // If chronicler can't find the key, it will return an error for that.
          // To us, that's not an error.
          error = null;
        }

        done(error, tweet);
      }
    );
  }

  function replyDateWasNotTooRecent(tweet, date, done) {
    if (typeof date !== 'object') {
      date = new Date(date);
    }
    var hoursElapsed = (Date.now() - date.getTime()) / (60 * 60 * 1000);

    if (hoursElapsed > behavior.hoursToWaitBetweenRepliesToSameUser) {
      // Pass the tweet down the waterfall.
      done(null, tweet);
    }
    else {
      // TODO: Consider making this a status object instead of an error.
      done(createErrorForTweet(tweet, {
        message: 'Replied too recently.',
        hoursSinceLastReply: hoursElapsed
      }));
    }
  }

  function isNotARetweetOfSelf(tweet, done) {
    var error = null;

    if (betterKnow.isRetweetOfUser('godtributes', tweet)) {
      error = createErrorForTweet(tweet, {
        message: 'This is a retweet of myself.',
      });
    }

    // Passes on the tweet. Error indicates if the tweet was a RT.
    callNextTick(done, error, tweet);
  }

  function isNotTweetOfSelf(tweet, done) {
    var error = null;

    if (betterKnow.isTweetOfUser('godtributes', tweet)) {
      error = createErrorForTweet(tweet, {
        message: 'This is one of my tweets.',
      });
    }

    // Passes on the tweet. Error indicates if the tweet was a self-tweet.
    callNextTick(done, error, tweet);
  }

  function statusContainsTextThatIsOKToReplyTo(tweet, done) {
    var textIsOK = canIChimeIn(tweet.text);
    if (!textIsOK) {
      log('Is NOT OK to respond to', tweet.text);
    }
    var error = null;
    if (!textIsOK) {
      error = createErrorForTweet(tweet, {
        message: 'Contents unsafe to respond to.',
        text: tweet.text
      });
    }

    callNextTick(done, error, tweet);
  }

  function getNounsFromTweet(tweet, done) {
    var mediaURLs = getImagesFromTweet(tweet);

    if (behavior.enableImageAnalysis &&
      mediaURLs && mediaURLs.length > 0 && probable.roll(3) === 1) {

      log('Looking through image:', mediaURLs[0]);
      analyzeTweetImages(tweet, sb(getNounsFromReport, done));
    }
    else {
      nounfinder.getNounsFromText(
        tweet.text, 
        function passNouns(finderError, nouns) {
          var error = null;
          if (!nouns || nouns.length < 1) {
            error = createErrorForTweet(tweet, {
              message: 'No nouns found.',
              nounFinderError: finderError
            });
          }
          done(error, tweet, nouns, false);
        }
      );
    }

    function getNounsFromReport(report, done) {
      done(null, tweet, report.nouns, true);
    }
  }

  function filterToNouns(tweet, nouns, isUsingTweetImage, done) {
    var maxCommonness = maxCommonnessForTopic;
    if (isUsingTweetImage) {
      maxCommonness = maxCommonnessForImageTopic;
    }

    nounfinder.filterNounsForInterestingness(
      nouns, 
      maxCommonness,
      function filterDone(finderError, filteredNouns) {
        var error = null;
        if (!filteredNouns || filteredNouns.length < 1) {
          error = createErrorForTweet(tweet, {
            message: 'Filtered ALL nouns from text.',
            nounFinderError: finderError
          });
        }

        done(error, tweet, filteredNouns, isUsingTweetImage);
      }
    );
  }

  function filterOutOldNouns(tweet, nouns, isUsingTweetImage, done) {
    var q = queue();
    nouns.forEach(function queueNounRecordCheck(noun) {
      q.defer(chronicler.topicWasUsedInReplyToUser, noun, tweet.user.id_str);
      q.defer(chronicler.topicWasUsedInTribute, noun);
    });
    // Here, `unused` means we haven't used it yet, and thus, we can use them
    // potentially.
    q.awaitAll(function buildListOfUnusedNouns(lookupError, usedFlags) {
      var unusedNouns = [];

      for (var i = 0; i < usedFlags.length; i += 2) {
        if (!usedFlags[i] && !usedFlags[i + 1]) {
          unusedNouns.push(nouns[i/2]);
        }
      }

      var error = null;
      if (lookupError || !unusedNouns || unusedNouns.length < 1) {
        error = createErrorForTweet(tweet, {
          message: 'No new material for user.',
          userId: tweet.user.id,
          chroniclerError: lookupError
        });
      }

      done(error, tweet, unusedNouns, isUsingTweetImage);
    });
  }

  function checkThatNounThresholdIsMet(tweet, nouns, neighbors, done) {
    var error = null;
    if (nouns.length + neighbors.length < nounCountThreshold) {
      error = createErrorForTweet(tweet, {
        message: 'There aren\'t enough usable nouns to work with.'
      });
    }
    callNextTick(done, error, tweet, nouns, neighbors);
  }

  // Assumes nouns has at least one element.
  function maybeGetNearestNeighborNouns(tweet, nouns, isUsingTweetImage, done) {
    if (!isUsingTweetImage && probable.roll(100) < w2vNeighborChance) {
      getWord2VecNeighbors(nouns, passNouns);
    }
    else {
      callNextTick(done, null, tweet, nouns, []);
    }

    function passNouns(error, neighbors) {
      if (error) {
        done(error);
      }
      else if (!neighbors) {
        // Send along original nouns.
        done(null, tweet, nouns, []);
      }
      else {
        done(null, tweet, nouns, neighbors.filter(iscool));
      }
    }
  }

  // Assumes nouns has at least one element.
  function makeExhortationFromNouns(tweet, nouns, neighbors, done) {
    var tweetLocale = 'en';
    if (tweet.lang) {
      tweetLocale = tweet.lang;
    }

    var selectedNouns;
    
    if (neighbors.length > 0) {
      selectedNouns = [
        probable.pickFromArray(nouns),
        probable.pickFromArray(neighbors)
      ];
    }
    else {
     selectedNouns = probable.shuffle(nouns).slice(0, 2);
   }

    var primaryTribute =
      tributeDemander.makeDemandForTopic(decorateWithEmojiOpts({
        topic: selectedNouns[0],
        prepositionalPhrase: prepPhrasePicker.getPrepPhrase(),
        tributeFigure: figurePicker.getMainTributeFigure()
      }));

    var secondaryTribute;

    if (selectedNouns.length > 1) {
      secondaryTribute =
        tributeDemander.makeDemandForTopic(decorateWithEmojiOpts({
          topic: selectedNouns[1],
          prepositionalPhrase: prepPhrasePicker.getPrepPhrase(),
          tributeFigure: figurePicker.getSecondaryTributeFigure()
        }));
    }

    var addressClause = '@' + tweet.user.screen_name + ' ';
    var exhortation = primaryTribute;
    if (secondaryTribute) {
      exhortation += ('! ' + secondaryTribute);
    }

    if (tweetLocale === 'en' && probable.roll(100) === 0) {
      tweetLocale = translator.pickRandomTranslationLocale({
        excludeLocale: 'en'
      });
    }

    if (tweetLocale !== 'en' && knownLanguages.indexOf(tweetLocale) !== -1) {
      translator.translate(exhortation, 'en', tweetLocale, returnTranslation);
    }
    else {
      callNextTick(
        done, null, tweet, addressClause + exhortation, selectedNouns
      );
    }

    function returnTranslation(error, translation) {
      if (error) {
        done(error, tweet, addressClause + exhortation, selectedNouns);
      }
      else {
        done(error, tweet, addressClause + translation, selectedNouns);
      }
    }
  }

  function createErrorForTweet(tweet, overrides) {
    return new StandardError(_.defaults(overrides, {
      id: tweet.id_str,
      screen_name: tweet.user.screen_name,
      // time: tweet.time
    }));
  }

  return {
    getExhortationForTweet: getExhortationForTweet
  };
};

module.exports = createExhorter;
