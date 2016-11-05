function IsVerb({wordnok}) {
  return isVerb;

  function isVerb(word, done) {
    wordnok.getPartsOfSpeech(word.toLowerCase(), checkPOS);

    function checkPOS(error, partsOfSpeech) {
      if (error) {
        done(error);
      }
      else {
        var result = partsOfSpeech.length > 0 &&
          partsOfSpeech.every(isSomeKindOfVerb);
        done(null, result);
      }
    }
  }
}

function isSomeKindOfVerb(partOfSpeech) {
  return partOfSpeech === 'verb' ||
    partOfSpeech === 'verb-transitive' ||
    partOfSpeech === 'verb-intransitive';
}

module.exports = IsVerb;
