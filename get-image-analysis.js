var base64 = require('node-base64-image');
var request = require('request');
var config = require('./config');
var sb = require('standard-bail')();

var apiURL = 'https://vision.googleapis.com/v1/images:annotate?key=' +
  config.googleVisionAPIKey;

var encooderOpts = {
  string: true
};

// This function fetches and encodes the image, assembles the request JSON,
// then basically does this:
// curl -v -k -s -H "Content-Type: application/json" https://vision.googleapis.com/v1/images:annotate?key=<key> --data-binary @vision-request.json

function getImageAnalysis(opts, done) {
  var imageURL;

  if (opts) {
    imageURL = opts.imageURL;
  }
 
  base64.base64encoder(imageURL, encooderOpts, sb(analyzeImage, done));
}

function analyzeImage(image, done) {
  var requestOpts = {
    url: apiURL,
    method: 'POST',
    json: true,
    body: createPostBody(image)
  };
  request(requestOpts, sb(passBody, done));
}

function passBody(response, body, done) {
  done(null, body);
}

function createPostBody(base64encodedImage) {
  return {
    "requests": [
      {
        "image": {
          content: base64encodedImage
        },
        "features": [
          {
            "type": "LABEL_DETECTION",
            "maxResults": 5
          }
        ]
      }
    ]
  };
}  

module.exports = getImageAnalysis;
