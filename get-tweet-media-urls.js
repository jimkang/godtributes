var pathExists = require('object-path-exists');
var _ = require('lodash');

function getTweetMediaURLs(tweet) {
  var mediaURLs = [];

  if (pathExists(tweet, ['entities', 'media'])) {
    var media = tweet.entities.media;
    if (media.length > 0) {
      var photos =  media.filter(isPhoto);
      mediaURLs = _.pluck(photos, 'media_url');
    }
  }

  return mediaURLs;
}

function isPhoto(medium) {
  return medium.type === 'photo';
}

module.exports = getTweetMediaURLs;
