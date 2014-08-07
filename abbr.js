// Only abbreviations that should be expanded should go here.

var fullWordsForAbbreviations = {
  jan: 'January',
  feb: 'February',
  jun: 'June',
  aug: 'August',
  sep: 'September',
  sept: 'September',
  oct: 'Rocktober',
  october: 'Rocktober',
  nov: 'November',
  dec: 'December',
  lb: 'pound',
  lbs: 'pounds'
};

function expand(word) {
  var expanded = word;
  if (word in fullWordsForAbbreviations) {
    expanded = fullWordsForAbbreviations[word];
  }
  return expanded;
}

module.exports = {
  expand: expand
};
