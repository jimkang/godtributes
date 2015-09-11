var filteredFollowback = require('filtered-followback');
var config = require('./config.js');

filteredFollowback(
  {
    twitterCreds: config.twitter,
    neverUnfollow: [
      2205976656
    ]
  },
  reportResults
);

function reportResults(error, followed, unfollowed) {
  if (error) {
    console.log(error);
  }
  console.log('Followed:', followed);
  console.log('Unfollowed:', unfollowed);
}
