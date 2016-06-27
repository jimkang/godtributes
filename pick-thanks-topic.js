var probable = require('probable');

var thanksTable = probable.createRangeTableFromDict({
  thanks: 15,
  'thank you': 10,
  appreciation: 10,
  gratitude: 10,
  acknowledgment: 10,
  recognition: 8,
  credit: 8,
  respect: 4
});

module.exports = thanksTable.roll;
