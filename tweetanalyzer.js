var behavior = require('./behaviorsettings');
var logger = require('./logger');

function isTextOKToReplyTo(text) {
  var words = text.split(/[ ":.,;!?#]/);
  return !words.some(isWordInTragedyBlacklist);
}

function isWordInTragedyBlacklist(word) {
  var normalizedWord = word.toLowerCase();
  return (behavior.tragedyModeBlacklist.indexOf(normalizedWord) !== -1);
}

module.exports = {
  isTextOKToReplyTo: isTextOKToReplyTo
};
