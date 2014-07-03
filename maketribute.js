var Bot = require('./node_modules/twit/examples/bot');
var config = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');
var figurepicker = require('./figurepicker');
var logger = require('./logger');

var wordnikSource = createWordnikSource();
var bot = new Bot(config.twitter);

var simulationMode = (process.argv[2] === '--simulate');

console.log('Tribute maker is running.');

function postTribute() {
  wordnikSource.getTopic(function postOnTopic(error, topic) {
    if (error) {
      handleError(error);
    }
    else {
      var demandOpts = {
        topic: topic,
        tributeFigure: figurepicker.getMainTributeFigure()
      };

      var tweetText = tributeDemander.makeDemandForTopic(demandOpts);

      if (simulationMode) {
        logger.log('Would have tweeted:', tweetText);
      }
      else {
        bot.tweet(tweetText, function reportTweetResult(error, reply) {
          logger.log((new Date()).toString(), 'Tweet posted:', reply.text);
        });        
      }
    }
  });  
}

postTribute();

function handleError(error) {
  logger.log('Response status:', error.statusCode);
  logger.log('Data:', error.data);
}
