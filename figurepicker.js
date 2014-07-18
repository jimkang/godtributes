var probable = require('probable');

var alternateFigureTable = probable.createRangeTableFromDict({
  throne: 40,
  goddess: 10,
  queen: 10,
  lord: 10,
  friend: 1,
  cat: 1,
  president: 5,
  blob: 5,
  tree: 1,
  monster: 5,
  fiend: 5,
  salad: 2,
  sandwich: 1,
  corporation: 1,
  community: 2,
  church: 1,
  committee: 1,
  empress: 1,
  'god-emperor': 1,
  dance: 3,
  recital: 1,
  mistress: 1
});

function getSecondaryTributeFigure() {
  return alternateFigureTable.roll(); 
}

function getMainTributeFigure() {
  var figure = 'GOD';
  if (probable.roll(4) === 0) {
    figure = getSecondaryTributeFigure();
  }
  return figure;
}

module.exports = {
  getMainTributeFigure: getMainTributeFigure,
  getSecondaryTributeFigure: getSecondaryTributeFigure
};

