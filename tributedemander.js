var inflection = require('inflection');
var uncountableNouns = require('./uncountablenouns');
var _ = require('lodash');


function makeDemandForTopic(topic) {
  function endsWithUncountableNoun(uncountable) {
    return endsWith(topic, uncountable);
  }

  if (isSingularPossessive(topic)) {
    topic = depossess(topic);
  }

  var isUncountable = 
    isAGerund(topic) || _.find(uncountableNouns, endsWithUncountableNoun);

  if (isUncountable) {
    var singularTopic = topic;
    var pluralTopic = topic;
  }
  else {
    var singularTopic = inflection.singularize(topic);
    var pluralTopic = inflection.pluralize(topic);
  }

  var demand = pluralTopic.toUpperCase() + ' FOR THE ' + 
    singularTopic.toUpperCase() + ' GOD';

  return demand;
}

// http://stackoverflow.com/questions/280634/endswith-in-javascript
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function isAGerund(word) {
  return endsWith(word, 'ing');
}

function isSingularPossessive(word) {
  return endsWith(word, '\'s');
}

// Assumed word ends in 's.
function depossess(word) {
  return word.substr(0, word.length - 2);
}

module.exports = {
  makeDemandForTopic: makeDemandForTopic
};
