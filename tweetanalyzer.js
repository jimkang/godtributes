var logger = require('./logger');

var tragedyModeBlacklist = require('iscool/defaultlists')
  .get('tragedyModeBlacklist');

function isTextOKToReplyTo(text) {
  var words = text.split(/[ ":.,;!?#]/);
  var isOK = !words.some(isWordInTragedyBlacklist);
  if (!isOK) {
    logger.info('Is NOT OK to respond to', text);
  }
  return isOK;
}

function isWordInTragedyBlacklist(word) {
  var normalizedWord = word.toLowerCase();
  return (tragedyModeBlacklist.indexOf(normalizedWord) !== -1);
}

module.exports = {
  isTextOKToReplyTo: isTextOKToReplyTo
};
