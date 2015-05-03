var probable = require('probable');

var alternateFigureTable = probable.createRangeTableFromDict({
  throne: 160,
  goddess: 40,
  queen: 40,
  lord: 40,
  friend: 4,
  cat: 4,
  president: 20,
  blob: 20,
  tree: 4,
  monster: 20,
  fiend: 16,
  salad: 8,
  sandwich: 4,
  corporation: 4,
  community: 8,
  church: 4,
  committee: 4,
  empress: 4,
  'god-emperor': 4,
  dance: 12,
  recital: 4,
  mistress: 4,
  nation: 4,
  dome: 8,
  dragon: 4,
  'director-general': 2,
  potentate: 8,
  monolith: 4,
  union: 4,
  shoggoth: 2,
  worm: 2,
  dracula: 1,
  voivode: 1,
  'home planet': 1
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

