var Bot = require('./node_modules/twit/examples/bot');
var config = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');
var probable = require('probable');

var wordnikSource = createWordnikSource();
var bot = new Bot(config.twitter);

var simulationMode = (process.argv[2] === '--simulate');

console.log('Tribute maker is running.');

var alternateFigureTable = probable.createRangeTableFromDict({
  throne: 40,
  goddess: 10,
  queen: 10,
  lady: 10,
  lord: 10,
  guy: 5,
  friend: 2,
  cat: 1,
  empire: 5,
  president: 5,
  ceo: 1,
  blob: 5,
  tree: 1,
  planet: 5,
  monster: 5,
  fiend: 5,
  toilet: 1,
  salad: 1,
  corporation: 1,
  community: 2,
  church: 1,
  board: 2,
  committee: 1,
  eagle: 1
});

function postTribute() {
  wordnikSource.getTopic(function postOnTopic(error, topic) {
    if (error) {
      handleError(error);
    }
    else {
      var demandOpts = {
          topic: topic
      };
      if (probable.roll(4) === 0) {
        demandOpts.tributeFigure = alternateFigureTable.roll();
      }
      var tweetText = tributeDemander.makeDemandForTopic(demandOpts);

      if (simulationMode) {
        console.log('Would have tweeted:', tweetText);
      }
      else {
        bot.tweet(tweetText, function reportTweetResult(error, reply) {
          console.log((new Date()).toString(), 'Tweet posted:', reply.text);
        });        
      }
    }
  });  
}

postTribute();

function handleError(error) {
  console.error('Response status:', error.statusCode);
  console.error('Data:', error.data);
}
