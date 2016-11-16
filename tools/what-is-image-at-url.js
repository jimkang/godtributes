/* global process */

var getImageAnalysis = require('../get-image-analysis');
var sb = require('standard-bail')({
  log: console.log
});

if (process.argv.length < 3) {
  console.log('Usage: node tools/what-is-image-at-url.js <url>');
  process.exit();
}

var opts = {
  imageURL: process.argv[2]
};

getImageAnalysis(opts, sb(reportAPIResponse));

function reportAPIResponse(body) {
  console.log(JSON.stringify(body, null, '  '));
}
