var probable = require('probable');

var thanksTable = probable.createRangeTableFromDict({
  thanks: 15,
  'thank you': 10,
  appreciation: 10,
  gratitude: 10,
  acknowledgment: 10,
  recognition: 8,
  credit: 8,
  respect: 4,
  vision: 10,
  sight: 6,
  eyes: 4,
  // patron: 10,
  // donor: 9,
  // benefactor: 6,
  // supporter: 6,
  // friend: 4
});

module.exports = thanksTable.roll;
