var behavior = require('./behaviorsettings');
var logger = require('./logger');
var wordfilter = require('wordfilter');

function isCool(word) {
  var normalizedWord = word.toLowerCase();
  
  var cool = (behavior.falsePositivesList.indexOf(normalizedWord) === -1);
  if (!cool) {
    return cool;
  }

  if (cool) {
    cool = (behavior.buzzkillBlacklist.indexOf(normalizedWord) === -1);
  }

  if (cool) {
    cool = !wordfilter.blacklisted(normalizedWord);
  }

  if (cool && behavior.tragedyHappenedRecently) {
    cool = (behavior.tragedyModeBlacklist.indexOf(normalizedWord) === -1);
  }

  if (!cool) {
    logger.log('Uncool word', word);
  }

  return cool;
}

module.exports = isCool;
