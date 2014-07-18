var probable = require('probable');

var prepPhraseTable = probable.createRangeTableFromDict({
  'FOR THE': 75,
  'TO THE': 20,
  'BEFORE THE': 5
});

function getPrepPhrase() {
  return prepPhraseTable.roll(); 
}

module.exports = {
  getPrepPhrase: getPrepPhrase
};
