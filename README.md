godtributes
===========

This is the source for @godtributes, a Twitter bot that posts tweets in the format:

    SOMETHING FOR THE SOMETHING GOD

It will also occasionally reply to followers in the same way, using words they've said.

It runs on Node and uses the excellent [twit](https://github.com/ttezel/twit) module to interact with Twitter.

Installation
------------

    git clone git@github.com:jimkang/godtributes.git
    npm install

Then, create a `config.js` file in the project root that contains your [Twitter API keys](https://apps.twitter.com/) and your [Wordnik API key](http://developer.wordnik.com/). Example:

    module.exports = {
      twitter: {
        consumer_key: 'asdfkljqwerjasdfalpsdfjas',
        consumer_secret: 'asdfasdjfbkjqwhbefubvskjhfbgasdjfhgaksjdhfgaksdxvc',
        access_token: '9999999999-zxcvkljhpoiuqwerkjhmnb,mnzxcvasdklfhwer',
        access_token_secret: 'opoijkljsadfbzxcnvkmokwertlknfgmoskdfgossodrh'
      },
      wordnikAPIKey: 'mkomniojnnuibiybvuytvutrctrxezewarewetxyfcftvuhbg'
    };

Set up an instance of [level-cache-server](https://github.com/jimkang/level-cache-server) in a parallel directory.

Optionally, set up a cron job for run `maketributes.js` and/or `exhort.js` periodically.

Usage
-----

To post a tribute ([something] FOR THE [something] GOD) tweet, run the commmand:

    node maketribute.js

To make a tribute and print it to the console, but not post it:

    node maketribute.js --simulate

To make tribute replies to followers:

    node exhort.js

To make tributes for followers and print them to the console, but not post them:

    node exhort.js --simulate

Blacklisting
------------

godtributes now uses [iscool](https://github.com/jimkang/iscool)'s blacklists. If you'd like to add to them, make an issue or PR there.

Tests
-----

Run tests with `make test`.

Structure
---------

**maketribute.js** is the script that makes tributes. It uses *wordniksource* to get topics for the tributes, *figurepicker* for the figures of the tributes, and *tributedemander* to construct the tributes.

**wordniksource** is an adapter for the [Wordnik API](developer.wordnik.com/docs.html). It makes calls to Wordnik to get random words, find word frequencies, and get parts of speech.

**tributedemander** puts together the "[something] FOR THE [something]" strings. It uses *canonicalizer* to get the proper forms of the topic and figure words involved.

**canonicalizer** figures out if a word is singular, plural, or possessive (largely using the [inflection](https://www.npmjs.org/package/inflection) module), then generates non-possessive singular and plural forms.

**figurepicker** rolls on a RPG-style table to generate figures for tribute. The main tribute figure has a 75% chance of being 'GOD'.


**exhort.js** is the script that gets the followers of @godtributes, decides whether to tweet at them, then comes up with a tribute to tweet at them. It uses all of the above modules, plus *nounfinder* to find interesting nouns within a follower's tweet and *chronicler* to keep track of what it's already done.

**nounfinder** uses a few internal rules and *wordniksource* for parts of speech and frequency to decide what words are interesting nouns.

**chronicler** uses a LevelDB database (via [basicset-levelwrap](https://github.com/jimkang/basicset-levelwrap)) to track which tweets have been replied to and when a user was last replied to.

License
-------

MIT.
