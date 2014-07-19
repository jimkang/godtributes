var probable = require('probable');

var prepPhraseTable = probable.createRangeTableFromDict({
  'FOR THE': 75,
  'TO THE': 4,
  'UNTO THE': 15,
  'BEFORE THE': 1
});

function getPrepPhrase() {
  return prepPhraseTable.roll(); 
}

module.exports = {
  getPrepPhrase: getPrepPhrase
};
