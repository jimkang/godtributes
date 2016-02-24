var defaultGetImageAnalysis = require('./get-image-analysis');
var _ = require('lodash');
var callNextTick = require('call-next-tick');
var logger = require('./logger');
var getTweetMediaURLs = require('./get-tweet-media-urls');

var sb = require('standard-bail')({
  log: logger.error
});

var falsePositives = [
  'web page',
  'screenshot',
  'multimedia',
  'clip art',
  'computer',
  'photography'
];

function AnalyzeTweetImages(createOpts) {
  var getImageAnalysis;

  if (createOpts) {
    getImageAnalysis = createOpts.getImageAnalysis;
  }

  if (!getImageAnalysis) {
    getImageAnalysis = defaultGetImageAnalysis;
  }

  function analyzeTweetImages(tweet, done) {
    var mediaUrls = getTweetMediaURLs(tweet);

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

function getNouns(imageAnalysis, done) {
  var nouns;

  if (imageAnalysis.responses.length > 0) {
    nouns =_.pluck(imageAnalysis.responses[0].labelAnnotations, 'description');
  }
  nouns = _.without.apply(_, [nouns].concat(falsePositives));

  done(null, {nouns: nouns});
}

module.exports = AnalyzeTweetImages;
