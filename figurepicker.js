var probable = require('probable');

var alternateFigureTable = probable.createRangeTableFromDict({
  throne: 80,
  goddess: 20,
  queen: 20,
  lord: 20,
  friend: 2,
  cat: 2,
  president: 10,
  blob: 10,
  tree: 2,
  monster: 10,
  fiend: 10,
  salad: 4,
  sandwich: 2,
  corporation: 2,
  community: 4,
  church: 2,
  committee: 2,
  empress: 2,
  'god-emperor': 2,
  dance: 6,
  recital: 2,
  mistress: 2,
  nation: 2,
  dome: 4,
  dragon: 2,
  'director-general': 1,
  potentate: 4,
  monolith: 1,
  union: 2,
  shoggoth: 1,
  worm: 1
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

