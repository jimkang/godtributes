var assert = require('assert');
var nounfinder = require('../nounfinder');
var queue = require('queue-async');

var textsAndNouns = [
  {
    text: 'Facebook running studies to see if it can manipulate users\' emotional states by skewing their feeds.', 
    nouns: [
      'facebook',
      'running',
      'study',
      'user',
      'state'
    ],
    interestingNouns: []
  },
  {
    text: 'During this work, the street will be closed to motorists, except for abutters.', 
    nouns: [
      'work',
      'street',
      'will',
      'motorist',
      'abutter'
    ],
    interestingNouns: [
      'motorist',
      'abutter'
    ]
  },
  {
    text: 'Property owners will maintain access to their driveways.', 
    nouns: [
      'will',
      'property',
      'owner',
      'access',
      'driveway'
    ],
    interestingNouns: [
      'driveway'
    ]
  },
  {
    text: 'In addition to the street closure, there will be no parking on either side of the street.', 
    nouns: [
      'street',
      'will',
      'addition',
      'closure',
      'no',
      'parking',
      'side'
    ],
    interestingNouns: [
      'closure'
    ]
  },
  {
    text: 'If voting didn\'t matter Republicans wouldn\'t be trying so hard to stop people from doing it.', 
    nouns: [
      'voting',
      'matter',
      'republican',
      'person',
      'doing'
    ],
    interestingNouns: [
      'republican'
    ]
  },
  {
    text: 'Hello, dystopia. You\'re a little early, but I\'ve been expecting you.',
    nouns: [
      'hello'
    ],
    interestingNouns: [
      'hello'
    ]
  },
  {
    text: 'So @seventeenmag\'s app has shared my stripes vs. polkadots ' + 
      '@polarpolls poll. http://polarb.com/65517  They know I\'m a dude in my forties, right?',
    nouns: [
      'app',
      'stripe',
      // 'v',
      'poll',
      'dude',
      // 'forties'
      // Should leave out v and forties.
    ],
    interestingNouns: [
      'stripe',
      'dude',
      // '40s'
      // should leave out 40s
    ]
  },  
  {
    text: 'So @seventeenmag\'s app has shared my stripes vs. polkadots ' + 
      '@polarpolls poll. http://polarb.com/65517  They know I\'m a dude in my 40s, right?',
    nouns: [
      'app',
      'stripe',
      // 'v',
      'poll',
      'dude',
      // '40s'
      // Should leave out v and 40.
    ],
    interestingNouns: [
      'stripe',
      'dude',
      // '40s'
      // should leave out 40s
    ]
  },  
  {
    text: 'PLS don\'t use pls in an exhortation',
    nouns: [
      'don\'t',
      'exhortation',
    ],
    interestingNouns: [
      'exhortation'
    ]
  }
];


suite('Noun getting', function gettingSuite() {
  this.timeout(30000);

  function testTextAndNouns(text, expectedNouns, done) {
    nounfinder.getNounsFromText(text,
      function checkNouns(error, nouns) {
        assert.ok(!error);
        assert.deepEqual(nouns, expectedNouns);
        done(error, nouns)
      }
    );
  }

  test('Test getting nouns from text.', function testGetNouns(testDone) {
    var q = queue(1);
    textsAndNouns.forEach(function addNounsTest(textAndNouns) {
      q.defer(testTextAndNouns, textAndNouns.text, textAndNouns.nouns);
    });
    q.awaitAll(testDone);
  });

  test('Check noun cache.', function testNounCache() {
    assert.deepEqual(nounfinder.getNounCache(), [
      'facebook',
      'running',
      'study',
      'user',
      'state',
      'work',
      'street',
      'will',
      'motorist',
      'abutter',
      'property',
      'owner',
      'access',
      'driveway',
      'addition',
      'closure',
      'no',
      'parking',
      'side',
      'voting',
      'matter',
      'republican',
      'person',
      'doing',
      'hello',
      'app',
      'stripe',
      'poll',
      'dude',
      'don\'t',
      'exhortation'
    ]);
  });

});

suite('Noun frequencies', function frequenciesSuite() {
  this.timeout(30000);

  function testInterestingFilter(nouns, expectedNouns, done) {
    nounfinder.filterNounsForInterestingness(nouns, 100,
      function checkNouns(error, filteredNouns) {
        assert.ok(!error);
        assert.deepEqual(filteredNouns, expectedNouns);
        done(error, filteredNouns)
      }
    );
  }

  test('Test filtering nouns', function testFilteringSetsOfNouns(testDone) {
    function addFilterTest(textAndNouns) {
      q.defer(testInterestingFilter, textAndNouns.nouns, 
        textAndNouns.interestingNouns
      );
    }
    var q = queue(1);
    textsAndNouns.forEach(addFilterTest);

    // Add an extra run to exercise the cache.
    addFilterTest(textsAndNouns[1]);
    
    q.awaitAll(testDone);
  });

  test('Check frequency cache.', function testFrequencyCache() {
    console.log(nounfinder.getFrequenciesForCachedNouns());
    assert.deepEqual(nounfinder.getFrequenciesForCachedNouns(), {
      facebook: 151,
      running: 1102,
      study: 880,
      user: 373,
      state: 2719,
      work: 4804,
      street: 569,
      will: 18228,
      motorist: 5,
      abutter: 0,
      property: 649,
      owner: 387,
      access: 936,
      driveway: 34,
      addition: 532,
      closure: 56,
      no: 9127,
      parking: 201,
      side: 1657,
      voting: 377,
      matter: 1382,
      republican: 51,
      person: 1675,
      doing: 2149,
      hello: 87,
      app: 163,
      stripe: 8,
      poll: 387,
      dude: 76,
      'don\'t': 5157,
      exhortation: 1
    });
  });

});
