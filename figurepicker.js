var probable = require('probable');

var alternateFigureTable = probable.createRangeTableFromDict({
  throne: 40,
  goddess: 10,
  queen: 10,
  lord: 10,
  guy: 5,
  friend: 2,
  cat: 1,
  president: 5,
  ceo: 1,
  blob: 5,
  tree: 1,
  monster: 5,
  fiend: 5,
  toilet: 1,
  salad: 1,
  sandwich: 1,
  corporation: 1,
  community: 2,
  church: 1,
  committee: 1
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

