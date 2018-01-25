var request = require('request');
var config = require('./config');
var sb = require('standard-bail')();
var _ = require('lodash');
var queue = require('d3-queue').queue;
var IsVerb = require('./is-verb');
var callNextTick = require('call-next-tick');

var underscoreRegex = /_/g;
var uppercaseRegex = /[A-Z]/g;

var badPhraseStarts = [
  'TO_',
  'WHEN_',
  'WITH_',
  'IN_PART',
  'WILL_',
  'SIEG_HEIL',
  'CHING_CHING',
  'FATTER_WALLET'
];

var badPhraseEnds = ['_OF', '_TO', '_THE'];

function GetWord2VecNeighbors({ nounfinder, probable, wordnok }) {
  var isVerb = IsVerb({
    wordnok: wordnok
  });

  return getWord2VecNeighbors;

  function getWord2VecNeighbors(words, done) {
    var wordsToGetNeighborsOf = probable.sample(
      words,
      probable.rollDie(words.length)
    );

    var opts = {
      method: 'GET',
      json: true,
      url: config.gnewsWord2VecURL,
      qs: {
        words: wordsToGetNeighborsOf.join(',')
      }
    };
    request(opts, sb(pickWords, done));
  }

  function pickWords(res, body, done) {
    if (body && body.message === 'Key not found in database') {
      done();
      return;
    }
    // console.log(JSON.stringify(body, null, '  '));
    // In the context of w2v results, we can throw out two-letter words.
    var words = _.pluck(body, 'word').filter(longerThanTwoChars);
    var phrases = [];
    var normalWords = [];

    words.forEach(putWordInBucket);
    phrases = phrases.filter(phraseIsOK);

    var nounFindingQueue = queue(2);

    nounFindingQueue.defer(nounfinder.getNounsFromWords, normalWords);
    nounFindingQueue.defer(getPhrasesEndingInNouns, phrases);

    nounFindingQueue.await(recombineBuckets);

    function putWordInBucket(word) {
      if (word.indexOf('_') === -1) {
        normalWords.push(word);
      } else {
        phrases.push(word);
      }
    }

    function recombineBuckets(error, wordNouns, phrasesWithNouns) {
      // console.log('normalWords', normalWords, 'phrases', phrases);
      // console.log('wordNouns', wordNouns, 'phrasesWithNouns', phrasesWithNouns);
      if (error) {
        done(error);
      } else {
        done(
          null,
          wordNouns.concat(_.compact(phrasesWithNouns).map(replaceUnderscores))
        );
      }
    }

    function getPhrasesEndingInNouns(phrases, done) {
      var q = queue();
      phrases.forEach(queueCheck);
      q.awaitAll(done);

      function queueCheck(phrase) {
        q.defer(findOutIfPhraseIsSuitable, phrase);
      }

      function findOutIfPhraseIsSuitable(phrase, findDone) {
        var phraseWords = phrase.split('_');
        if (phraseWords.length < 1) {
          callNextTick(findDone);
        } else {
          var q = queue();
          q.defer(nounfinder.getNounsFromWords, phraseWords.slice(-1));
          q.defer(isVerb, phraseWords[0]);
          q.await(passPhrase);
        }

        function passPhrase(error, phraseNouns, isVerb) {
          if (error) {
            findDone(error);
          } else {
            findDone(null, phraseNouns.length > 0 && !isVerb ? phrase : null);
          }
        }
      }
    }
  }
}

function longerThanTwoChars(w) {
  return w && w.length > 2;
}

function replaceUnderscores(w) {
  return w.replace(underscoreRegex, ' ');
}

function phraseIsOK(phrase) {
  return (
    phrase.length > 0 &&
    !phrase.match(uppercaseRegex) &&
    !badPhraseStarts.some(startsWith) &&
    !badPhraseEnds.some(endsWith)
  );

  function startsWith(badStart) {
    return phrase.startsWith(badStart);
  }

  function endsWith(badEnd) {
    return phrase.endsWith(badEnd);
  }
}

module.exports = GetWord2VecNeighbors;
