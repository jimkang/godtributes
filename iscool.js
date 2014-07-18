var behavior = require('./behaviorsettings');
var logger = require('./logger');

function isCool(word) {
  var cool = (behavior.falsePositivesList.indexOf(word) === -1);
  if (!cool) {
    return cool;
  }

  if (cool) {
    cool = (behavior.buzzkillBlacklist.indexOf(word) === -1);
  }

  if (cool && behavior.tragedyHappenedRecently) {
    cool = (behavior.tragedyModeBlacklist.indexOf(word) === -1);
  }

  if (!cool) {
    logger.log('Uncool word', word);
  }

  return cool;
}

module.exports = isCool;
