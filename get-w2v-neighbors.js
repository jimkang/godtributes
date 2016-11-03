var request = require('request');
var config = require('./config');
var sb = require('standard-bail')();
var _ = require('lodash');

var underscoreRegex = /_/g;

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
    var compoundWords = [];
    var normalWords = [];

    words.forEach(putWordInBucket);
    compoundWords = compoundWords.map(replaceUnderscores);

    // We're giving compound words a pass for now.
    nounfinder.getNounsFromWords(
      normalWords, sb(recombineBuckets, done)
    );

    function putWordInBucket(word) {
      if (word.indexOf('_') === -1) {
        normalWords.push(word);
      }
      else {
        compoundWords.push(word);
      }
    }

    function recombineBuckets(nouns, done) {      
      done(null, nouns.concat(compoundWords));
    }
  }
}

function longerThanTwoChars(w) {
  return w && w.length > 2;
}

function replaceUnderscores(w) {
  return w.replace(underscoreRegex, ' ');
}

module.exports = GetWord2VecNeighbors;
