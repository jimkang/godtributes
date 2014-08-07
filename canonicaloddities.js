var _ = require('lodash');

var pluralsForSingulars = {
  goose: 'geese',
  criterion: 'criteria',
  cafe: 'cafes',
  phenomenon: 'phenomena',
  octopus: 'octopi',
  pi: 'pi'
};

var singularsForPlurals = _.invert(pluralsForSingulars);

function wordIsInOddities(word) {
  return word in pluralsForSingulars || word in singularsForPlurals;
}

function getBothForms(word) {
  var singular;
  var plural;

  if (word in pluralsForSingulars) {
    singular = word;
    plural = pluralsForSingulars[singular];
  }
  else if (word in singularsForPlurals) {
    plural = word;
    singular = singularsForPlurals[plural];
  }
  return [singular, plural];
}

module.exports = {
  pluralsForSingulars: pluralsForSingulars,
  singularsForPlurals: singularsForPlurals,
  wordIsInOddities: wordIsInOddities,
  getBothForms: getBothForms
}