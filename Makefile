test:
	mocha --ui tdd -R spec tests/tributedemander-tests.js

debug-test:
	mocha debug --ui tdd -R spec tests/tributedemander-tests.js

