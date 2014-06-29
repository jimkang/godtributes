var levelwrap = require('basicset-levelwrap');
var db = levelwrap.createLevelWrap('tributes.db');

function createDoc(id) {
  db.saveDoc({
      id: id
    }, 
    function done(error) {
      if (error) {
        console.log(error);
      }
    }
  );
}

function recordThatTweetWasRepliedTo(tweetId) {
  db.saveObject({
    doc: 'tweetsrepliedto',
    id: tweetId
  },
  function done(error) {
    if (error) {
      console.log(error);
    }
  });
}

function recordThatUserWasRepliedTo(userId) {
  db.saveObject({
    doc: 'lastreplydatesforusers',
    id: userId,
    date: (new Date()).toISOString()
  },
  function done(error) {
    if (error) {
      console.log(error);
    }
  });
}

function tweetWasRepliedTo(tweetId, done) {
  db.getObject(tweetId, 'tweetsrepliedto', function checkResult(error, index) {
    var replied = (!error);
    done(null, replied);
  });
}

function whenWasUserLastRepliedTo(userId, done) {
  db.getObject(userId, 'lastreplydatesforusers', 
    function reconstituteDate(error, record) {
      var date = null;
      if (!error) {
        date = new Date(record.date);
      }
      done(error, date);
    }
  );
}

(function initialize() {
  db.getDoc('tweetsrepliedto', function done(error, doc) {
    if (error && error.name === 'NotFoundError') {
      createDoc('tweetsrepliedto');
    }
  });
  db.getDoc('lastreplydatesforusers', function done(error, doc) {
    if (error && error.name === 'NotFoundError') {
      createDoc('lastreplydatesforusers');
    }
  });
})();

module.exports = {
  recordThatTweetWasRepliedTo: recordThatTweetWasRepliedTo,
  recordThatUserWasRepliedTo: recordThatUserWasRepliedTo,
  tweetWasRepliedTo: tweetWasRepliedTo,
  whenWasUserLastRepliedTo: whenWasUserLastRepliedTo
};
