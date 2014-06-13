var assert = require('assert');
var tributeDemander = require('../tributedemander');

suite('Praise generator', function tributeDemanderSuite() {
  test('Make demands for singular topics', function singularTopicsTest() {
    var singularTopics = [
      'pipewrench',
      'karate manual',
      'hand sanitizer',
      'car battery',
    ];

    var expectedDemands = [
      'PIPEWRENCHES FOR THE PIPEWRENCH GOD',
      'KARATE MANUALS FOR THE KARATE MANUAL GOD',
      'HAND SANITIZERS FOR THE HAND SANITIZER GOD',
      'CAR BATTERIES FOR THE CAR BATTERY GOD',
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
      'harmonicas',
    ];

    var expectedDemands = [
      'SANDWICHES FOR THE SANDWICH GOD',
      'GRAPPLING HOOKS FOR THE GRAPPLING HOOK GOD',
      'HARMONICAS FOR THE HARMONICA GOD',
    ];

    var demands = pluralTopics.map(tributeDemander.makeDemandForTopic);
    demands.forEach(function checkDemand(demand, i) {
      assert.equal(demand, expectedDemands[i]);
    });
  });

  test('Make demands for with singular/plural forms that are the same', 
    function unpluralizableTopicsTest() {
      var weirdPluralizationTopics = [
        'sweatpants',
        'corn syrup',
        'toilet paper',
        'interior flat paint',
        'milk',
        'mayonnaise'
      ];

      var expectedDemands = [
        'SWEATPANTS FOR THE SWEATPANTS GOD',
        'CORN SYRUP FOR THE CORN SYRUP GOD',
        'TOILET PAPER FOR THE TOILET PAPER GOD',
        'INTERIOR FLAT PAINT FOR THE INTERIOR FLAT PAINT GOD',
        'MILK FOR THE MILK GOD',
        'MAYONNAISE FOR THE MAYONNAISE GOD'
      ];

      var demands = weirdPluralizationTopics
        .map(tributeDemander.makeDemandForTopic);
      demands.forEach(function checkDemand(demand, i) {
        assert.equal(demand, expectedDemands[i]);
      });
    }
  );

});

