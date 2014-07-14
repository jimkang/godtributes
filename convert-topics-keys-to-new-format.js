var levelup = require('level');
var through2 = require('through2');

var dbLocation = process.argv[2];
var db = levelup(dbLocation, {valueEncoding: 'json'});

var rs = db.createReadStream({
  start: 's!topics-sent-to',
  end: 's!tw'
});

var extraUserIdRegEx = /!\d+-/;

var convertStream = through2({
    objectMode: true
  },
  function convert(data, enc, callback) {
    this.push({
      key: data.key.replace(extraUserIdRegEx, '!'),
      value: data.value
    });
    callback();
  }
);

var ws = db.createWriteStream();

ws.on('error', function (err) {
  console.log('Oh my!', err)
})
ws.on('close', function () {
  console.log('Stream closed')
})


rs.pipe(convertStream);
convertStream.pipe(ws);
