var test = require('tape');
var _ = require('lodash');
var callNextTick = require('call-next-tick');
var GetWord2VecNeighbors = require('../get-w2v-neighbors');
var assertNoError = require('assert-no-error');
var createNounfinder = require('nounfinder');
var config = require('../config');
var createProbable = require('probable').createProbable;
var seedrandom = require('seedrandom');
var createWordnok = require('wordnok').createWordnok;

var cases = [
  {
    name: 'Words from vision',
    seed: 'vision',
    words: ['logo', 'brand'],
    expected: [ 'Adidas Puma', 'Onitsuka Tiger', 'Greedy Genius', 'trademark infringement' ]
  },
  {
    name: 'empathy, trump',
    seed: 'empathy trump',
    words: ['empathy', 'trump'],
    expected: ['desperateness']
  },
  {
    name: 'Weird short words',
    seed: 'weird',
    words: ['comp', 'ar'],
    expected: [ 'crit', 'uni', 'Bloke Bingo' ]
  },
  {
    name: 'Vermin',
    seed: 'vermin',
    words: ['mice', 'spider', 'insect'],
    expected:[ 'critter', 'snake', 'grasshopper', 'squirrel', 'critter', 'bee', 'gopher', 'insect eater', 'creepy critters', 'Madagascar hissing cockroaches', 'woolly bears' ]
  },
  {
    name: 'Not in word2vec model',
    seed: 'missing',
    words: ['match-up'],
    expected: undefined
  },
  {
    name: 'Filter dumb phrases',
    seed: 'filter',
    words: ['promenade', 'spittal'],
    expected: [ 'promenade', 'seafront', 'quay', 'piazza', 'quayside', 'quay', 'seafront promenade', 'roof terrace', 'pavement cafés', 'cobblestone lanes' ]
  }
];

var nounfinder = createNounfinder({
  wordnikAPIKey: config.wordnikAPIKey
});

var wordnok =  createWordnok({
  apiKey: config.wordnikAPIKey
});

cases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, runTest);

  function runTest(t) {
    var getWord2VecNeighbors = GetWord2VecNeighbors({
      nounfinder: nounfinder,
      probable: createProbable({
        random: seedrandom(testCase.seed)
      }),
      wordnok: wordnok
    });
    getWord2VecNeighbors(testCase.words, checkNeighbors);

    function checkNeighbors(error, neighbors) {
      assertNoError(t.ok, error, 'No error while getting neighbors.');
      t.deepEqual(neighbors, testCase.expected, 'Neighbors are correct.');
      t.end();
    }
  }
}
