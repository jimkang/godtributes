var _ = require('lodash');

var pluralsForSingulars = {
  goose: 'geese',
  criterion: 'criteria',
  cafe: 'cafes',
  phenomenon: 'phenomena',
  octopus: 'octopi',
  pi: 'pi',
  usa: 'usa',
  ia: 'ia! ia!',
  'drive-by': 'drive-bys',
  shoe: 'shoes',
  cookie: 'cookies',
  microwave: 'microwaves',
  corgi: 'corgis',
  passerby: 'passersby'
};

var singularsForPlurals = _.invert(pluralsForSingulars);

// These are one-way plural-to-singular conversions. These singular forms 
// should never be converted back to the plural forms. This is here basically 
// to make up for grammatical errors or odd usage in the source tweets.
singularsForPlurals.pis = 'pi'; 

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
  if (word in singularsForPlurals) {
    plural = word;
    singular = singularsForPlurals[plural];
  }

  // Second pass. Since some mappings are one-way, it's possible to find a 
  // singular form of a word from a plural that's incorrect. If we plug that 
  // singular back into pluralsForSingulars, we should get the correct plural.

  if (singular in pluralsForSingulars) {
    plural =  pluralsForSingulars[singular];
  }
  if (plural in singularsForPlurals) {
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