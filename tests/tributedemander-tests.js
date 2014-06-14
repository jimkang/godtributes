var assert = require('assert');
var tributeDemander = require('../tributedemander');

suite('Praise generator', function tributeDemanderSuite() {
  test('Make demands for singular topics', function singularTopicsTest() {
    var singularTopics = [
      'pipewrench',
      'karate manual',
      'hand sanitizer',
      'car battery',
      'interior flat paint'
    ];

    var expectedDemands = [
      'PIPEWRENCHES FOR THE PIPEWRENCH GOD',
      'KARATE MANUALS FOR THE KARATE MANUAL GOD',
      'HAND SANITIZERS FOR THE HAND SANITIZER GOD',
      'CAR BATTERIES FOR THE CAR BATTERY GOD',
      'INTERIOR FLAT PAINTS FOR THE INTERIOR FLAT PAINT GOD'
    ];

    var demands = singularTopics.map(tributeDemander.makeDemandForTopic);
    demands.forEach(function checkDemand(demand, i) {
      assert.equal(demand, expectedDemands[i]);
    });
  });

  test('Make demands for plural topics', function pluralTopicsTest() {
    var pluralTopics = [
      'sandwiches',
      'grappling hooks',
      'harmonicas'
    ];

    var expectedDemands = [
      'SANDWICHES FOR THE SANDWICH GOD',
      'GRAPPLING HOOKS FOR THE GRAPPLING HOOK GOD',
      'HARMONICAS FOR THE HARMONICA GOD'
    ];

    var demands = pluralTopics.map(tributeDemander.makeDemandForTopic);
    demands.forEach(function checkDemand(demand, i) {
      assert.equal(demand, expectedDemands[i]);
    });
  });

  test('Make demands for with mass nouns that are the same', 
    function massNounTopicsTest() {
      var weirdPluralizationTopics = [
        'corn syrup',
        'toilet paper',
        'milk',
        'mayonnaise',
        'blood', 
        'sweatpants',
        'growth',
        'sourness',
        'counseling'
      ];

      var expectedDemands = [
        'CORN SYRUP FOR THE CORN SYRUP GOD',
        'TOILET PAPER FOR THE TOILET PAPER GOD',
        'MILK FOR THE MILK GOD',
        'MAYONNAISE FOR THE MAYONNAISE GOD',
        'BLOOD FOR THE BLOOD GOD',
        'SWEATPANTS FOR THE SWEATPANT GOD',
        'GROWTH FOR THE GROWTH GOD',
        'SOURNESS FOR THE SOURNESS GOD',
        'COUNSELING FOR THE COUNSELING GOD'
      ];

      var demands = weirdPluralizationTopics
        .map(tributeDemander.makeDemandForTopic);
      demands.forEach(function checkDemand(demand, i) {
        assert.equal(demand, expectedDemands[i]);
        // console.log(demand);
      });
    }
  );

});

