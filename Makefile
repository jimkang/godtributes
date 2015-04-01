MOCHA = node_modules/mocha/bin/mocha
MOCHACMD = $(MOCHA) --ui tdd -R spec 
HOMEDIR = $(shell pwd)
PM2 = $(HOMEDIR)/node_modules/pm2/bin/pm2
GITDIR = /var/repos/godtributes.git
USER = noderunner
LEVELCACHEDIR = '../level-cache-server'

test: test-exhort
	$(MOCHACMD) tests/tributedemander-tests.js
	$(MOCHACMD) tests/tweetanalyzer-tests.js

test-exhort:
	$(MOCHA) --R spec tests/exhort-tests.js

test-exhort-integration: stop-chronicler start-chronicler start-level-cache
	node tests/integration/exhort-tweet-test.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js

start-chronicler:
	$(PM2) start start-chronicler.js --watch --name godtributes-chronicler || \
	echo "godtributes-chronicler has already been started."

stop-chronicler:
	$(PM2) stop godtributes-chronicler || echo "Didn't need to stop process."

start-exhortation-server: start-level-cache start-chronicler
	$(PM2) start exhortationserver.js --watch --name godtributes-exhortations || \
	echo "godtributes-exhortations has already been started."

stop-exhortation-server:
	$(PM2) stop godtributes-exhortations || echo "Didn't need to stop process."

check-exhortation-server:
	$(PM2) info godtributes-exhortations

npm-install:
	cd $(HOMEDIR)
	npm install
	npm prune

sync-worktree-to-git:
	git --work-tree=$(HOMEDIR) --git-dir=$(GITDIR) checkout -f

post-receive: sync-worktree-to-git npm-install stop-chronicler start-chronicler \
	stop-exhortation-server start-exhortation-server

# The idea is for the repo's post-receive hook to simply be:
# cd /var/www/godtributes && make post-receive

install-logrotate-conf:
	cp $(HOMEDIR)/admin/logrotate.conf_entry /etc/logrotate.d/godtributes

start-level-cache:
	$(PM2) start $(LEVELCACHEDIR)/start-cache-server.js --name level-cache || \
	echo "level-cache has already been started."

tribute: start-chronicler start-level-cache
	node maketribute.js
