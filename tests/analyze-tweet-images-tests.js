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
      nouns: []
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
      nouns: [
        'clothing',
        'orange',
        'flower',
        'woman',
        'costume'
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
      nouns: [
        'flower',
        'medal',
        'jewellery',
        'brass',
        'gold'
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
      nouns: [
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
      nouns: [
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
      nouns: [
        'cartoon',
        'play',
        'invertebrate',
        'emblem'
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
      t.end();
    }
  });
}
