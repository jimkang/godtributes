var request = require('request');
var config = require('./config');
var sb = require('standard-bail')();
var _ = require('lodash');

var underscoreRegex = /_/g;

var badPhraseStarts = [
  'TO_',
  'WHEN_',
  'WITH_',
  'IN_PART'
];

var badPhraseEnds = [
  '_OF',
  '_TO',
  '_THE'
];

function GetWord2VecNeighbors({nounfinder}) {
  return getWord2VecNeighbors;

  function getWord2VecNeighbors(words, done) {
    var opts = {
      method: 'GET',
      json: true,
      url: config.gnewsWord2VecURL,
      qs: {
        words: words.join(',')
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
    phrases = phrases.filter(phraseIsOK).map(replaceUnderscores);

    // We're giving compound words a pass for now.
    nounfinder.getNounsFromWords(
      normalWords, sb(recombineBuckets, done)
    );

    function putWordInBucket(word) {
      if (word.indexOf('_') === -1) {
        normalWords.push(word);
      }
      else {
        phrases.push(word);
      }
    }

    function recombineBuckets(nouns, done) {      
      done(null, nouns.concat(phrases));
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
  return !badPhraseStarts.some(startsWith) && !badPhraseEnds.some(endsWith);

  function startsWith(badStart) {
    return phrase.startsWith(badStart);
  }

  function endsWith(badEnd) {
    return phrase.endsWith(badEnd);
  }
}

module.exports = GetWord2VecNeighbors;
