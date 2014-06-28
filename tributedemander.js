var canonicalizer = require('./canonicalizer');

function makeDemandForTopic(topic) {
  var forms = canonicalizer.getSingularAndPluralForms(topic);

  var demand = forms[1].toUpperCase() + ' FOR THE ' + 
    forms[0].toUpperCase() + ' GOD';

  return demand;
}

module.exports = {
  makeDemandForTopic: makeDemandForTopic
};
