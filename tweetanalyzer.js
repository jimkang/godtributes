var behavior = require('./behaviorsettings');
var logger = require('./logger');

function isTextOKToReplyTo(text) {
  var words = text.split(/[ ":.,;!?#]/);
  var isOK = !words.some(isWordInTragedyBlacklist);
  if (!isOK) {
    logger.log('Is NOT OK to respond to', text);
  }
  return isOK;
}

function isWordInTragedyBlacklist(word) {
  var normalizedWord = word.toLowerCase();
  return (behavior.tragedyModeBlacklist.indexOf(normalizedWord) !== -1);
}

module.exports = {
  isTextOKToReplyTo: isTextOKToReplyTo
};
