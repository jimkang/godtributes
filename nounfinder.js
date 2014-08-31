// Singleton.

var createWordnikSource = require('./wordniksource');
var _ = require('lodash');
var canonicalizer = require('./canonicalizer');
var isCool = require('./iscool');
var cardinalNumbers = require('./cardinalNumbers');

var wordniksource = createWordnikSource();
var nounCache = [];
var frequenciesForNouns = {};

function getNounsFromText(text, done) {
  var words = getSingularFormsOfWords(worthwhileWordsFromText(text));
  words = _.uniq(words.map(function lower(s) { return s.toLowerCase(); }));
  words = words.filter(wordIsAtLeastTwoCharacters);
  words = words.filter(isCool);
  words = words.filter(wordIsNotANumeral);
  words = words.filter(wordIsNotACardinalNumber);

  // Get already-looked-up nouns from cache.
  var nouns = _.intersection(nounCache, words);
  words = _.without.apply(_, [words].concat(nouns));

  wordniksource.getPartsOfSpeechForMultipleWords(
    words, 
    function filterToNouns(error, partsOfSpeech) {
      if (!error) {
        var newNouns = (words.filter(function couldBeNoun(word, i) {
          return (partsOfSpeech[i].indexOf('noun') !== -1);
        }));
        nouns = nouns.concat(newNouns);
        nounCache = nounCache.concat(newNouns);
      }
      done(error, nouns);
    }
  );
}

function getSingularFormsOfWords(words) {
  return words.map(function getSingular(word) {
    var forms = canonicalizer.getSingularAndPluralForms(word);
    return forms[0];
  });
}

function filterNounsForInterestingness(nouns, maxFrequency, done) {
  var addIndexIfUnder = _.curry(addIndexIfFreqIsUnderMax)(maxFrequency);

  function nounAtIndex(index) {
    return nouns[index];
  }

  var nounsWithKnownFrequencies = 
    _.intersection(_.keys(frequenciesForNouns), nouns);

  var interestingNouns = _.compact(_.map(nounsWithKnownFrequencies, 
    function getNounIfFreqIsUnderMax(freq, noun) {
      return (freq < maxFrequency) ? noun : undefined;
    }
  ));

  nouns = _.without.apply(_, [nouns].concat(interestingNouns));

  wordniksource.getWordFrequencies(nouns, 
    function filterByFrequency(error, frequencies) {
      if (error) {
        done(error, interestingNouns);
      }
      else {
        var indexesOfFreqsUnderMax = frequencies.reduce(addIndexIfUnder, []);
        var foundNouns = indexesOfFreqsUnderMax.map(nounAtIndex);
        interestingNouns = interestingNouns.concat(foundNouns);

        frequencies.forEach(function saveFreqForNoun(freq, i) {
          frequenciesForNouns[nouns[i]] = freq;
        });
        done(null, interestingNouns);
      }
    }
  );
}

function addIndexIfFreqIsUnderMax(maxFreq, indexesUnderMax, freq, index) {
  if (freq < maxFreq) {
    indexesUnderMax.push(index);
  }
  return indexesUnderMax;
}

function worthwhileWordsFromText(text) {
  var words = text.split(/[ ":.,;!?#]/);
  var filteredWords = [];
  words = _.compact(words);
  if (words.length > 0) {
    filteredWords = words.filter(isWorthCheckingForNounHood);
  }
  return filteredWords;
}

function isWorthCheckingForNounHood(word) {
  return word.length > 1 && wordDoesNotStartWithAtSymbol(word);
}

function wordDoesNotStartWithAtSymbol(word) {
  return word.indexOf('@') === -1;
}

function wordIsNotANumeral(word) {
  return isNaN(+word);
}

function wordIsNotACardinalNumber(word) {
  return cardinalNumbers.indexOf(word) === -1;
}

function wordIsAtLeastTwoCharacters(word) {
  return word.length > 1;
}

// TODO: nounCache should be in recordkeeper.
function getNounCache() {
  return nounCache;
}

function getFrequenciesForCachedNouns() {
  return frequenciesForNouns;
}

module.exports = {
  getNounsFromText: getNounsFromText,
  filterNounsForInterestingness: filterNounsForInterestingness,
  getNounCache: getNounCache,
  getFrequenciesForCachedNouns: getFrequenciesForCachedNouns
};
