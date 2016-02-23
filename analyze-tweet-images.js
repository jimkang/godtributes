var defaultGetImageAnalysis = require('./get-image-analysis');
var pathExists = require('object-path-exists');
var _ = require('lodash');
var callNextTick = require('call-next-tick');
var logger = require('./logger');
var sb = require('standard-bail')({
  log: logger.error
});

function AnalyzeTweetImages(createOpts) {
  var getImageAnalysis;

  if (createOpts) {
    getImageAnalysis = createOpts.getImageAnalysis;
  }

  if (!getImageAnalysis) {
    getImageAnalysis = defaultGetImageAnalysis;
  }

  function analyzeTweetImages(tweet, done) {
    var mediaUrls;
    if (pathExists(tweet, ['entities', 'media'])) {
      var media = tweet.entities.media;
      if (media.length > 0) {
        var photos =  media.filter(isPhoto);
        mediaUrls = _.pluck(photos, 'media_url');
      }
    }

    if (!mediaUrls || mediaUrls.length < 1) {
      callNextTick(done, null, {nouns: []});
    }
    else {
      var imageAnalysisOpts = {
        imageURL: mediaUrls[0] // Just the first one for now.
      };
      getImageAnalysis(imageAnalysisOpts, sb(getNouns, done));
    }
  }

  return analyzeTweetImages;
}

function isPhoto(medium) {
  return medium.type === 'photo';
}

function getNouns(imageAnalysis, done) {
  var nouns;

  if (imageAnalysis.responses.length > 0) {
    nouns =_.pluck(imageAnalysis.responses[0].labelAnnotations, 'description');
  }

  done(null, {nouns: nouns});
}

module.exports = AnalyzeTweetImages;
