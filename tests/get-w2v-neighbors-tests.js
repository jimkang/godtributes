var test = require('tape');
var _ = require('lodash');
var callNextTick = require('call-next-tick');
var GetWord2VecNeighbors = require('../get-w2v-neighbors');
var assertNoError = require('assert-no-error');
var seedrandom = require('seedrandom');
var createProbable = require('probable').createProbable;
var createNounfinder = require('nounfinder');
var config = require('../config');

var cases = [
  {
    name: 'Words from vision',
    seed: 'vision',
    words: ['logo', 'brand'],
    expected: [
      'trademark infringement',
      'designer Marc Ecko'
    ]
  },
  {
    name: 'empathy, trump',
    seed: 'empathy trump',
    words: ['empathy', 'trump'],
    expected: [
      'defy logic',
      'woefully misplaced'
    ]
  },
  {
    name: 'Weird short words',
    seed: 'weird',
    words: ['comp', 'ar'],
    expected: [
      'mon',
      'ing'
    ]
  },
  {
    name: 'Vermin',
    seed: 'vermin',
    words: ['mice', 'spider', 'insect'],
    expected: [
      'hobo spiders',
      'aphid'
    ]
  }
];

var nounfinder = createNounfinder({
  wordnikAPIKey: config.wordnikAPIKey
});

cases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, runTest);

  function runTest(t) {
    var getWord2VecNeighbors = GetWord2VecNeighbors({
      probable: createProbable({
        random: seedrandom(testCase.seed)
      }),
      nounfinder: nounfinder
    });
    getWord2VecNeighbors(testCase.words, checkNeighbors);

    function checkNeighbors(error, neighbors) {
      assertNoError(t.ok, error, 'No error while getting neighbors.');
      t.deepEqual(neighbors, testCase.expected, 'Neighbors are correct.');
      t.end();
    }
  }
}
