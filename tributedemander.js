var canonicalizer = require('./canonicalizer');

function makeDemandForTopic(opts) {
  var tributeFigure = (opts && opts.tributeFigure) ? 
    opts.tributeFigure.toUpperCase() : 'GOD';
  
  var forms = canonicalizer.getSingularAndPluralForms(opts.topic);

  var demand = forms[1].toUpperCase() + ' FOR THE ' + 
    forms[0].toUpperCase() + ' ' + tributeFigure;

  return demand;
}

module.exports = {
  makeDemandForTopic: makeDemandForTopic
};
