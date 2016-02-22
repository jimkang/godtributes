var base64 = require('node-base64-image');
var request = require('request');
var config = require('../config');

if (process.argv.length < 3) {
  console.log('Usage: node tools/what-is-image-at-url.js <url>');
  process.exit();
}

var url = process.argv[2];

var apiURL = 'https://vision.googleapis.com/v1/images:annotate?key=' +
  config.googleVisionAPIKey;

var postBody = {
  "requests": [
    {
      "image": {
      },
      "features": [
        {
          "type": "LABEL_DETECTION",
          "maxResults": 5
        },
        // {
        //   "type": "IMAGE_PROPERTIES",
        //   maxResults: 5
        // }
      ]
    }
  ]
};

var options = {
  string: true
};
 
base64.base64encoder(url, options, analyzeImage);

function analyzeImage(error, image) {
  if (error) {
      console.log(error);
  }
  else {
    // curl -v -k -s -H "Content-Type: application/json" https://vision.googleapis.com/v1/images:annotate?key=<key> --data-binary @vision-request.json
    postBody.requests[0].image.content = image;
    var requestOpts = {
      url: apiURL,
      method: 'POST',
      json: true,
      body: postBody,
      headers:  {
        'Content-Type': 'application/json'
      }
    };
    request(requestOpts, reportAPIResponse);
  }
}

function reportAPIResponse(error, response, body) {
  debugger;
  if (error) {
    console.log(error);
  }
  else {
    console.log(JSON.stringify(body, null, '  '));
  }
}
