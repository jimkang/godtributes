// var defaultGetImageAnalysis = require('./get-image-analysis');
var pathExists = require('object-path-exists');
var _ = require('lodash');
var callNextTick = require('call-next-tick');

function AnalyzeTweetImages(createOpts) {
  var getImageAnalysis;

  if (createOpts) {
    getImageAnalysis = createOpts.getImageAnalysis;
  }

  if (!getImageAnalysis) {
    // getImageAnalysis = defaultGetImageAnalysis;
  }

  function analyzeTweetImages(tweet, done) {
    var report = {
      imageInterestingness: 0,
      notableConcepts: []      
    };
    var mediaUrls;

    if (pathExists(tweet, ['entities', 'media'])) {
      var media = tweet.entities.media;
      if (media.length > 0) {
        var photos =  media.filter(isPhoto);
        mediaUrls = _.pluck(photos, 'media_url');
      }
    }

    if (!mediaUrls || mediaUrls.length < 1) {
      callNextTick(done, null, report);
    }
    else {
      // TODO.
    }
  }

  return analyzeTweetImages;
}

function isPhoto(medium) {
  return medium.type === 'photo';
}

module.exports = AnalyzeTweetImages;
