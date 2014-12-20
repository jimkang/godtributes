MOCHA = node_modules/mocha/bin/mocha
MOCHACMD = $(MOCHA) --ui tdd -R spec 
HOMEDIR = /var/www/godtributes
PM2 = $(HOMEDIR)/node_modules/pm2/bin/pm2
GITDIR = /var/repos/godtributes.git
USER = noderunner

test:
	$(MOCHACMD) tests/tributedemander-tests.js
	$(MOCHACMD) tests/topicpool-tests.js -t 3000
	$(MOCHACMD) tests/iscool-tests.js
	$(MOCHACMD) tests/tweetanalyzer-tests.js
	$(MOCHACMD) tests/nounfinder-tests.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js

start-chronicler:
	$(PM2) start start-chronicler.js --name godtributes-chronicler

stop-chronicler:
	$(PM2) stop godtributes-chronicler || echo "Didn't need to stop process."

npm-install:
	cd $(HOMEDIR)
	npm install
	npm prune

sync-worktree-to-git:
	git --work-tree=$(HOMEDIR) --git-dir=$(GITDIR) checkout -f

post-receive: sync-worktree-to-git npm-install stop-chronicler start-chronicler 

# The idea is for the repo's post-receive hook to simply be:
# cd /var/www/godtributes && make post-receive
