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

  test('Make demands for with mass nouns that do not change when pluralized', 
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
          'iOS',
          'Mars',
          'mars',
          'ALA',
          'pi',
          'earthenware',
          'pix',
          'surf',
          'usa',
          'ia',
          'oxygen',
          'estrogen',
          'narcissism',
          'democratization',
          'physics',
          'frost',
          'hemlock',
          'camouflauge',
          'shoes',
          'shoe',
          'paranoia'
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
          'IOS FOR THE IOS GOD',
          'MARS FOR THE MARS GOD',
          'MARS FOR THE MARS GOD',
          'ALA FOR THE ALA GOD',
          'PI FOR THE PI GOD',
          'EARTHENWARE FOR THE EARTHENWARE GOD',
          'PIX FOR THE PIX GOD',
          'SURF FOR THE SURF GOD',
          'USA FOR THE USA GOD',
          'IA! IA! FOR THE IA GOD',
          'OXYGEN FOR THE OXYGEN GOD',
          'ESTROGEN FOR THE ESTROGEN GOD',
          'NARCISSISM FOR THE NARCISSISM GOD',
          'DEMOCRATIZATION FOR THE DEMOCRATIZATION GOD',
          'PHYSICS FOR THE PHYSICS GOD',
          'FROST FOR THE FROST GOD',
          'HEMLOCK FOR THE HEMLOCK GOD',
          'CAMOUFLAUGE FOR THE CAMOUFLAUGE GOD',
          'SHOES FOR THE SHOE GOD',
          'SHOES FOR THE SHOE GOD',
          'PARANOIA FOR THE PARANOIA GOD'
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
        'octopi',
        'drive-by',
        'cookie',
        'cookies',
        'pis',
        'microwaves',
        'corgi',
        'corgis',
        'passerby',
        'passersby'
      ],
      expectedDemands: [
        'CRITERIA FOR THE CRITERION GOD',
        'CRITERIA FOR THE CRITERION GOD',
        'CAFES FOR THE CAFE GOD',
        'PHENOMENA FOR THE PHENOMENON GOD',
        'PHENOMENA FOR THE PHENOMENON GOD',
        'OCTOPI FOR THE OCTOPUS GOD',
        'OCTOPI FOR THE OCTOPUS GOD',
        'DRIVE-BYS FOR THE DRIVE-BY GOD',
        'COOKIES FOR THE COOKIE GOD',
        'COOKIES FOR THE COOKIE GOD',
        'PI FOR THE PI GOD',
        'MICROWAVES FOR THE MICROWAVE GOD',
        'CORGIS FOR THE CORGI GOD',
        'CORGIS FOR THE CORGI GOD',
        'PASSERSBY FOR THE PASSERBY GOD',
        'PASSERSBY FOR THE PASSERBY GOD'        
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

  test('Repeat-style pluralization', function emojiTest() {
    var demandOpts = {
      topic: 'some-emoji',
      isEmoji: true,
      repeatNTimesToPluralize: 4
    };

    var demand = tributeDemander.makeDemandForTopic(demandOpts);
    assert.equal(demand, 'some-emoji some-emoji some-emoji some-emoji' + 
      '  FOR THE some-emoji  GOD'
    );
  });

  test('Very special cases', function specialTest() {
    topicsTest({
      topics: [
        'confederate',
        'confederacy'
      ],
      expectedDemands: [
        'CONFEDERATE FLAGS FOR THE CONFEDERATE FLAG FIRE',
        'CONFEDERACIES FOR THE DOG-WHISTLING WHITE SUPREMACIST HUMAN SHITPILE'
      ]
    });
  });
});
