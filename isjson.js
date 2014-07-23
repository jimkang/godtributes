// Based on http://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string-in-javascript-without-using-try
// Which is based on some version of https://github.com/douglascrockford/JSON-js/blob/master/json2.js.

function isJSON(text) {
  if (!text || text.length < 1) {
    return false;
  }
  return (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '')));
}

module.exports = isJSON;
