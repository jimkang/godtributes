var filteredFollowback = require('filtered-followback');
var config = require('./config.js');
var jsonfile = require('jsonfile');
var _ = require('lodash');

var spamListLocation = __dirname + '/data/spam-users.json';
var spamUsers = jsonfile.readFileSync(spamListLocation);

filteredFollowback(
  {
    twitterCreds: config.twitter,
    neverUnfollow: [
      2205976656,
      4814406209
    ],
    blacklist: spamUsers
  },
  reportResults
);

function reportResults(error, followed, unfollowed, filteredOut) {
  if (error) {
    console.log(error);
  }
  console.log('Followed:', followed);
  console.log('Unfollowed:', unfollowed);
  console.log('Filtered out:', filteredOut);
  updateSpamList(filteredOut);
}

function updateSpamList(filteredOut) {
  var newSpamList = _.union(spamUsers, filteredOut);
  jsonfile.writeFileSync(spamListLocation, newSpamList);
}
