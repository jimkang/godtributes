var canonicalizer = require('canonicalizer');
var isEmoji = require('is-emoji');
var probable = require('probable');

function makeDemandForTopic(opts) {
  if (isSpecialTopic(opts.topic)) {
    return makeDemandForSpecialTopic(opts);
  }

  var tributeFigure =
    opts && opts.tributeFigure ? opts.tributeFigure.toUpperCase() : 'GOD';

  var prepositionalPhrase =
    opts && opts.prepositionalPhrase
      ? opts.prepositionalPhrase.toUpperCase()
      : 'FOR THE';

  var forms;

  if (opts.isEmoji) {
    var pluralFormArray = [];
    for (var i = 0; i < opts.repeatNTimesToPluralize; ++i) {
      pluralFormArray.push(opts.topic);
    }
    forms = [opts.topic, pluralFormArray.join(' ')];
  } else {
    forms = canonicalizer.getSingularAndPluralForms(opts.topic);
  }

  var postEmojiSpace = '';

  if (opts.isEmoji) {
    postEmojiSpace = ' ';
  } else {
    forms = forms.map(function upperize(s) {
      return s.toUpperCase();
    });
  }

  var demand =
    forms[1] +
    ' ' +
    postEmojiSpace +
    prepositionalPhrase +
    ' ' +
    forms[0] +
    ' ' +
    postEmojiSpace +
    tributeFigure;

  return demand;
}

function decorateWithEmojiOpts(demandOpts) {
  if (isEmoji(demandOpts.topic)) {
    demandOpts.isEmoji = true;
    demandOpts.repeatNTimesToPluralize =
      probable.roll(3) + probable.roll(3) + 2;
  }
  return demandOpts;
}

var demandsForSpecialTopics = {
  confederate: 'CONFEDERATE FLAGS FOR THE CONFEDERATE FLAG FIRE',
  confederacy:
    'CONFEDERACIES FOR THE DOG-WHISTLING WHITE SUPREMACIST HUMAN SHITPILE'
};

function isSpecialTopic(topic) {
  return topic in demandsForSpecialTopics;
}

function makeDemandForSpecialTopic(opts) {
  return demandsForSpecialTopics[opts.topic];
}

module.exports = {
  makeDemandForTopic: makeDemandForTopic,
  decorateWithEmojiOpts: decorateWithEmojiOpts
};
