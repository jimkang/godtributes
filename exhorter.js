var StandardError = require('standard-error');
var async = require('async');
var queue = require('queue-async');
var conformAsync = require('conform-async');
var _ = require('lodash');
var betterKnow = require('better-know-a-tweet');
var LanguageDetect = require('languagedetect');
var localesForDetectorLanguages = require('./locales-for-detector-languages');
var translator = require('./translator');
var probable = require('probable');

var languageDetector = new LanguageDetect();

function createExhorter(opts) {
  var chronicler = opts.chronicler;
  var logger = opts.logger;
  var behavior = opts.behavior;
  var tweetAnalyzer = opts.tweetAnalyzer;
  var nounfinder = opts.nounfinder;
  var maxCommonnessForTopic = opts.maxCommonnessForTopic;
  var nounCountThreshold = opts.nounCountThreshold;
  var tributeDemander = opts.tributeDemander;
  var prepPhrasePicker = opts.prepPhrasePicker;
  var figurePicker = opts.figurePicker;
  var decorateWithEmojiOpts = opts.decorateWithEmojiOpts;

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
        checkThatNounThresholdIsMet,
        makeExhortationFromNouns
      ],
      finalDone
    );

    function waterfallKickoff(done) {
      conformAsync.callBackOnNextTick(done, null, tweet);
    }

    function finalDone(error, tweet, exhortation, topics) {
      if (error) {
        logger.log(error);
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
      done(createErrorForTweet(tweet, {
        message: 'Replied too recently.',
        userId: tweet.user.id,
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
    conformAsync.callBackOnNextTick(done, error, tweet);
  }

  function isNotTweetOfSelf(tweet, done) {
    var error = null;

    if (betterKnow.isTweetOfUser('godtributes', tweet)) {
      error = createErrorForTweet(tweet, {
        message: 'This is one of my tweets.',
      });
    }

    // Passes on the tweet. Error indicates if the tweet was a self-tweet.
    conformAsync.callBackOnNextTick(done, error, tweet);
  }

  function statusContainsTextThatIsOKToReplyTo(tweet, done) {
    var textIsOK = tweetAnalyzer.isTextOKToReplyTo(tweet.text);
    var error = null;
    if (!textIsOK) {
      error = createErrorForTweet(tweet, {
        message: 'Contents unsafe to respond to.'
      });
    }

    conformAsync.callBackOnNextTick(done, error, tweet);
  }

  function getNounsFromTweet(tweet, done) {
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
        done(error, tweet, nouns);
      }
    );
  }

  function filterToNouns(tweet, nouns, done) {
    nounfinder.filterNounsForInterestingness(
      nouns, 
      maxCommonnessForTopic, 
      function filterDone(finderError, filteredNouns) {
        var error = null;
        if (!filteredNouns || filteredNouns.length < 1) {
          error = createErrorForTweet(tweet, {
            message: 'Filtered ALL nouns from text.',
            nounFinderError: finderError
          });
        }

        done(error, tweet, filteredNouns);
      }
    );
  }

  function filterOutOldNouns(tweet, nouns, done) {
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
      logger.log('unusedNouns', unusedNouns);

      var error = null;
      if (lookupError || !unusedNouns || unusedNouns.length < 1) {
        error = createErrorForTweet(tweet, {
          message: 'No new material for user.',
          userId: tweet.user.id,
          chroniclerError: lookupError
        });
      }

      done(error, tweet, unusedNouns);
    });
  }

  function checkThatNounThresholdIsMet(tweet, nouns, done) {
    var error = null;
    if (nouns.length < nounCountThreshold) {
      error = createErrorForTweet(tweet, {
        message: 'There aren\'t enough usable nouns to work with.'
      });
    }
    conformAsync.callBackOnNextTick(done, error, tweet, nouns);
  }

  // Assumes nouns has at least one element.
  function makeExhortationFromNouns(tweet, nouns, done) {
    var tweetLocale = 'en';

    var languages = languageDetector.detect(tweet.text);

    if (languages && languages.length > 0 && languages[0][1] > 0.5) {
      var language = languages[0][0];
      if (language in localesForDetectorLanguages) {
        tweetLocale = localesForDetectorLanguages[language];
      }
    }

    var selectedNouns = _.sample(nouns, 2);

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

    // TODO: Use seedrandom for probable to make tests work more consistently 
    // than 19/20 times.
    if (tweetLocale === 'en' && probable.roll(100) === 0) {
      tweetLocale = translator.pickRandomTranslationLocale({
        excludeLocale: 'en'
      });
    }

    if (tweetLocale !== 'en') {
      translator.translate(exhortation, 'en', tweetLocale, returnTranslation);
    }
    else {
      conformAsync.callBackOnNextTick(
        done, null, tweet, addressClause + exhortation, selectedNouns
      );
    }

    function returnTranslation(error, translation) {
      if (error) {
        console.log(error);
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
      text: tweet.text
    }));
  }

  return {
    getExhortationForTweet: getExhortationForTweet
  };
};

module.exports = createExhorter;
