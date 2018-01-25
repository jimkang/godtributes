var probable = require('probable');

var prepPhraseTable = probable.createRangeTableFromDict({
  'FOR THE': 80,
  'TO THE': 1,
  'UNTO THE': 10,
  'BEFORE THE': 1
});

function getPrepPhrase() {
  return prepPhraseTable.roll();
}

module.exports = {
  getPrepPhrase: getPrepPhrase
};
