test:
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/topicpool-tests.js -t 3000
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/iscool-tests.js
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/tweetanalyzer-tests.js
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/nounfinder-tests.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js
