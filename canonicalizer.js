var inflection = require('inflection');
var uncountableNouns = require('./uncountablenouns');
var _ = require('lodash');

function getSingularAndPluralForms(word) {
  function endsWithUncountableNoun(uncountable) {
    return endsWith(word, uncountable);
  }

  word = depossess(word);

  var isUncountable = 
    isAGerund(word) || _.find(uncountableNouns, endsWithUncountableNoun);

  var pluralWord = word;
  var singularWord = word;  

  if (!isUncountable) {
    // TODO: Move this into inflection?
    if (endsWith(word, 'is') || endsWith(word, 'us')) {
      pluralWord = pluralWord + 'es';
    }
    else {
      singularWord = inflection.singularize(word);
      pluralWord = inflection.pluralize(word);
    }
  }

  return [singularWord, pluralWord];
}

// http://stackoverflow.com/questions/280634/endswith-in-javascript
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function isAGerund(word) {
  return endsWith(word, 'ing');
}

// Assumed word ends in 's.
function depossess(word) {
  var depossessed = word;
  if (endsWith(word, '\'s')) {
    // Singular possessive.
    depossessed = word.substr(0, word.length - 2);
  }
  else if (word[0] !== '\'' && endsWith(word, 's\'')) {
    // Plural possessive.
    depossessed = word.substr(0, word.length - 1);
  }
  return depossessed;
}

module.exports = {
  getSingularAndPluralForms: getSingularAndPluralForms
};
