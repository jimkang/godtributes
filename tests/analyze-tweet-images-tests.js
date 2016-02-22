var test = require('tape');
var _ = require('lodash');
var callNextTick = require('call-next-tick');
var AnalyzeTweetImages = require('../analyze-tweet-images');

var exampleImageTweetBase = require('./fixtures/example-image-tweet.js');
var imageAPIResponses = require('./fixtures/google-image-api-responses.js');

var cases = [
  {
    name: 'No image',
    tweet: {
      id_str: '0', 
      user: {
        id: 0,
        screen_name: 'deathmtn'
      },
      text: 'Not posting an image!'
    },
    imageAPIResponse: {},
    expected: {
      imageInterestingness: 0,
      notableConcepts: []
    }
  },
  {
    name: "costume",
    tweet: _.defaults(
      _.cloneDeep(exampleImageTweetBase),
      {
        text: "Here is a costume!"
      }
    ),
    imageAPIResponse: imageAPIResponses.costume,
    expected: {
      imageInterestingness: 5,
      notableConcepts: [
        'costume',
        'orange',
        'flower',
        'woman'
      ]
    }
  },
  {
    name: "award",
    tweet: _.defaults(
      _.cloneDeep(exampleImageTweetBase),
      {
        text: "Here is an award!"
      }
    ),
    imageAPIResponse: imageAPIResponses.award,
    expected: {
      imageInterestingness: 5,
      notableConcepts: [
        'jewellery',
        'brass',
        'gold',
        'medal',
        'flower'
      ]
    }
  },
  {
    name: "band",
    tweet: _.defaults(
      _.cloneDeep(exampleImageTweetBase),
      {
        text: "Here is a band!"
      }
    ),
    imageAPIResponse: imageAPIResponses.band,
    expected: {
      imageInterestingness: 5,
      notableConcepts: [
        'musician',
        'person',
        'people',
        'team'
      ]
    }
  },
  {
    name: "poster",
    tweet: _.defaults(
      _.cloneDeep(exampleImageTweetBase),
      {
        text: "Here is a poster!"
      }
    ),
    imageAPIResponse: imageAPIResponses.poster,
    expected: {
      imageInterestingness: 5,
      notableConcepts: [
        'album cover',
        'poster'
      ]
    }
  },
  {
    name: "wormDrawing",
    tweet: _.defaults(
      _.cloneDeep(exampleImageTweetBase),
      {
        text: "Here is a wormDrawing!"
      }
    ),
    imageAPIResponse: imageAPIResponses.wormDrawing,
    expected: {
      imageInterestingness: 5,
      notableConcepts: [
        'invertebrate',
        'emblem',
        'cartoon',
        'play'
      ]
    }
  },
];

cases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, function runTest(t) {
    var analyzeTweetImages = AnalyzeTweetImages({
      getImageAnalysis: function mockGetImageAnalysis(opts, done) {
        callNextTick(done, null, testCase.imageAPIResponse);
      }
    });

    analyzeTweetImages(testCase.tweet, checkAnalysis);

    function checkAnalysis(error, report) {
      t.ok(!error, 'No error while analyzing.');
      t.deepEqual(report, testCase.expected, 'Report is correct.');
    }
  });
}
