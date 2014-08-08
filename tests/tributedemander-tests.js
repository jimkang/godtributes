var assert = require('assert');
var tributeDemander = require('../tributedemander');

function topicsTest(opts) {
  var demands = [];
  opts.topics.forEach(function makeDemand(topic) {
    var demandOpts = {
      topic: topic
    };
    if (opts.tributeFigure) {
      demandOpts.tributeFigure = opts.tributeFigure;
    }
    demands.push(tributeDemander.makeDemandForTopic(demandOpts));
  });
    
  demands.forEach(function checkDemand(demand, i) {
    assert.equal(demand, opts.expectedDemands[i]);
  });
}


suite('Praise generator', function tributeDemanderSuite() {
  test('Make demands for singular topics', function singularTopicsTest() {
    topicsTest({
      topics: [
        'pipewrench',
        'karate manual',
        'hand sanitizer',
        'car battery',
        'interior flat paint'
      ],
      expectedDemands: [
        'PIPEWRENCHES FOR THE PIPEWRENCH GOD',
        'KARATE MANUALS FOR THE KARATE MANUAL GOD',
        'HAND SANITIZERS FOR THE HAND SANITIZER GOD',
        'CAR BATTERIES FOR THE CAR BATTERY GOD',
        'INTERIOR FLAT PAINTS FOR THE INTERIOR FLAT PAINT GOD'
      ]
    });
  });

  test('Make demands for singular topics that end in s', 
    function singularTopicsThatEndInSTest() {
      topicsTest({
        topics: [
          'epidermis',
          'kiss',
          'corpus'
        ],
        expectedDemands: [
          'EPIDERMISES FOR THE EPIDERMIS GOD',
          'KISSES FOR THE KISS GOD',
          'CORPUSES FOR THE CORPUS GOD'
        ]
      });
    }
  );

  test('Make demands for plural topics', function pluralTopicsTest() {
    topicsTest({
      topics: [
        'sandwiches',
        'grappling hooks',
        'harmonicas',
        'geese'
      ],
      expectedDemands: [
        'SANDWICHES FOR THE SANDWICH GOD',
        'GRAPPLING HOOKS FOR THE GRAPPLING HOOK GOD',
        'HARMONICAS FOR THE HARMONICA GOD',
        'GEESE FOR THE GOOSE GOD'
      ]
    });

  });

  test('Make demands for with mass nouns that are the same', 
    function massNounTopicsTest() {
      topicsTest({
        topics: [
          'corn syrup',
          'toilet paper',
          'milk',
          'mayonnaise',
          'blood', 
          'sweatpants',
          'growth',
          'sourness',
          'counseling',
          'nineties',
          'iOS',
          'mars',
          'ALA',
          'pi',
          'earthenware',
          'pix',
          'surf',
          'usa',
          'ia'
        ],
        expectedDemands: [
          'CORN SYRUP FOR THE CORN SYRUP GOD',
          'TOILET PAPER FOR THE TOILET PAPER GOD',
          'MILK FOR THE MILK GOD',
          'MAYONNAISE FOR THE MAYONNAISE GOD',
          'BLOOD FOR THE BLOOD GOD',
          'SWEATPANTS FOR THE SWEATPANT GOD',
          'GROWTH FOR THE GROWTH GOD',
          'SOURNESS FOR THE SOURNESS GOD',
          'COUNSELING FOR THE COUNSELING GOD',
          'NINETIES FOR THE NINETIES GOD',
          'IOS FOR THE IOS GOD',
          'MARS FOR THE MARS GOD',
          'ALA FOR THE ALA GOD',
          'PI FOR THE PI GOD',
          'EARTHENWARE FOR THE EARTHENWARE GOD',
          'PIX FOR THE PIX GOD',
          'SURF FOR THE SURF GOD',
          'USA FOR THE USA GOD',
          'IA! IA! FOR THE IA GOD'
        ]
      });
    }
  );

  test('Make demands for number nouns', 
    function numberNounTopicsTest() {
      topicsTest({
        topics: [
          '1000s',
          '90s',
          '2000s',
          '187'
        ],
        expectedDemands: [
          '1000S FOR THE 1000S GOD',
          '90S FOR THE 90S GOD',
          '2000S FOR THE 2000S GOD',
          '187 FOR THE 187 GOD'
        ]
      });
    }
  );

  test('Make demands for possessive topics', function pluralTopicsTest() {
    topicsTest({
      topics: [
        'butcher\'s',
        'fishes\''
      ],
      expectedDemands: [
        'BUTCHERS FOR THE BUTCHER GOD',
        'FISHES FOR THE FISH GOD'
      ]
    });
  });

  test('Make demands for abbreviated topics', function abbrTopicsTest() {
    topicsTest({
      topics: [
        'sept',
        'oct',
        'lb',
        'lbs'
      ],
      expectedDemands: [
        'SEPTEMBERS FOR THE SEPTEMBER GOD',
        'ROCKTOBERS FOR THE ROCKTOBER GOD',
        'POUNDS FOR THE POUND GOD',
        'POUNDS FOR THE POUND GOD'
      ]
    });
  });

  test('Make demands for oddly pluralized topics', function oddPluralsTest() {
    topicsTest({
      topics: [
        'criteria',
        'criterion',
        'cafe',
        'phenomenon',
        'phenomena',
        'octopus',
        'octopi'
      ],
      expectedDemands: [
        'CRITERIA FOR THE CRITERION GOD',
        'CRITERIA FOR THE CRITERION GOD',
        'CAFES FOR THE CAFE GOD',
        'PHENOMENA FOR THE PHENOMENON GOD',
        'PHENOMENA FOR THE PHENOMENON GOD',
        'OCTOPI FOR THE OCTOPUS GOD',
        'OCTOPI FOR THE OCTOPUS GOD'
      ]
    });
  });

  test('Make demands for thrones', function pluralTopicsTest() {
    topicsTest({
      tributeFigure: 'throne',
      topics: [
        'pipewrench',
        'epidermis',
        'grappling hooks',
        'sweatpants',        
        'butcher\'s'
      ],
      expectedDemands: [
        'PIPEWRENCHES FOR THE PIPEWRENCH THRONE',
        'EPIDERMISES FOR THE EPIDERMIS THRONE',
        'GRAPPLING HOOKS FOR THE GRAPPLING HOOK THRONE',
        'SWEATPANTS FOR THE SWEATPANT THRONE',
        'BUTCHERS FOR THE BUTCHER THRONE'
      ]
    });
  });

});

