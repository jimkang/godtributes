var config = require('./config');
var exportMethods = require('export-methods');
var MSTranslator = require('mstranslator');
var probable = require('probable');
var _ = require('lodash');
var log = require('./logger').info;

function translate(text, fromLocale, toLocale, done) {
  var theTranslator = new MSTranslator(config.MSTranslator, true);
  var translateOpts = {
    text: text,
    from: fromLocale,
    to: toLocale
  };
  theTranslator.translate(translateOpts, done);
}

// For now, a western bias for a mostly-western audience.
var localeChances = {
  mww: 1, //Hmong Daw
  hi: 4, // Hindi
  nl: 10, // Dutch
  el: 20, // Greek
  fr: 40, // French
  he: 20, // Hebrew
  ko: 20, // Korean
  fa: 10, // Persian
  ms: 10, // Malay
  pl: 15, // Polish
  es: 70, // Spanish
  ru: 20, // Russian
  ro: 4, // Romanian
  sv: 10, // Swedish
  th: 10, // Thai
  tr: 4, // Turkish
  id: 1, // Indonesian
  ur: 1, // Urdu
  'zh-CHS': 20, // Chinese Simplified
  fi: 4, // Finnish
  ar: 20, // Arabic
  de: 40, // German
  ja: 20, // Japanese
  ht: 1, // Haitian Creole
  en: 1,
  bg: 1, // Bulgarian
  hr: 10, // Croatian
  cs: 1, // Czech,
  da: 2, // Danish
  et: 1, // Estonian
  hu: 1, // Hungarian
  it: 15, // Italian
  lv: 1, // Latvian
  lt: 1, // Lithuanian
  mt: 1, // Maltese
  no: 1, // Norwegian
  pt: 4, // Portuguese
  'sr-Cyrl': 1, // Serbian (Cyrillic),
  sk: 1, // Slovak
  sl: 1, // Slovenian
  uk: 1, // Ukranian
  vi: 4, // Vietnamese
  cy: 12, // Welsh
  yua: 1 // Yucatec Maya
};

function pickRandomTranslationLocale(opts) {
  // opts.excludeLocale;
  var table = probable.createRangeTableFromDict(
    _.omit(localeChances, opts.excludeLocale)
  );

  return table.roll();
}

function translateToRandomLocale(text, fromLocale, done) {
  var toLocale = pickRandomTranslationLocale({
    excludeLocale: fromLocale
  });
  log('Translating', text, 'from', fromLocale, 'to', toLocale);
  translate(text, fromLocale, toLocale, done);
}

module.exports = exportMethods(
  translate,
  pickRandomTranslationLocale,
  translateToRandomLocale
);
