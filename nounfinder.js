// Singleton.

var createWordnikSource = require('./wordniksource');
var _ = require('lodash');
var canonicalizer = require('canonicalizer');
var createIsCool = require('iscool');
var cardinalNumbers = require('./cardinalnumbers');
var isEmoji = require('is-emoji');
var emojiSource = require('./emojisource');

var isCool = createIsCool({
  logger: console
});

var wordniksource = createWordnikSource();
var nounCache = [];
var frequenciesForNouns = {};

function getNounsFromText(text, done) {
  var emojiNouns = _.uniq(getEmojiFromText(text));
  var nonEmojiText = _.without(text.split(''), emojiNouns).join('');

  var words = getSingularFormsOfWords(worthwhileWordsFromText(nonEmojiText));
  words = _.uniq(words.map(function lower(s) { return s.toLowerCase(); }));
  words = words.filter(wordIsCorrectLength);
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
      
      done(error, nouns.concat(emojiNouns));
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

  var emojiNouns = nouns.filter(isEmoji)
    .filter(emojiSource.emojiValueIsOKAsATopic);

  nouns = nouns.filter(function isNotEmoji(noun) {
    return !isEmoji(noun);
  });

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
        done(null, interestingNouns.concat(emojiNouns));
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

function wordIsCorrectLength(word) {
  return wordIsAtLeastTwoCharacters(word) || isEmoji(word);
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

// From http://crocodillon.com/blog/parsing-emoji-unicode-in-javascript.
var emojiSurrogateRangeDefs = [
  {
    lead: '\ud83c',
    trailRange: ['\udf00', '\udfff']
  },
  {
    lead: '\ud83d',
    trailRange: ['\udc00', '\ude4f']
  },
  {
    lead: '\ud83d',
    trailRange: ['\ude80', '\udeff']
  }
];

function isEmojiSurrogatePair(leadChar, trailingChar) {
  return emojiSurrogateRangeDefs.some(function charCodeIsInRange(rangeDef) {
    return leadChar === rangeDef.lead &&
      trailingChar >= rangeDef.trailRange[0] &&
      trailingChar <= rangeDef.trailRange[1];
  });
}

function getEmojiFromText(text) {
  var emojiArray = [];
  for (var i = 0; i < text.length - 1; ++i) {
    var leadChar = text[i];
    var trailChar = text[i + 1];
    if (isEmojiSurrogatePair(leadChar, trailChar)) {
      emojiArray.push(text.substr(i, 2));
    }
  }
  return emojiArray;
}

module.exports = {
  getNounsFromText: getNounsFromText,
  filterNounsForInterestingness: filterNounsForInterestingness,
  getNounCache: getNounCache,
  getFrequenciesForCachedNouns: getFrequenciesForCachedNouns
};
