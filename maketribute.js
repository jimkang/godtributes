var Bot = require('./node_modules/twit/examples/bot');
var config = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');

var wordnikSource = createWordnikSource();
var bot = new Bot(config.twitter);

console.log('Tribute maker is running.');

function postTribute() {
  wordnikSource.getTopic(function postOnTopic(error, topic) {
    if (error) {
      handleError(error);
    }
    else {
      bot.tweet(tributeDemander.makeDemandForTopic(topic), 
        function reportTweetResult(error, reply) {
          console.log((new Date()).toString(), 'Tweet posted:', reply.text);
        }
      );
    }
  });  
}

postTribute();

function handleError(error) {
  console.error('Response status:', error.statusCode);
  console.error('Data:', error.data);
}
