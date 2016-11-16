MOCHA = node_modules/mocha/bin/mocha
MOCHACMD = $(MOCHA) --ui tdd -R spec 
HOMEDIR = $(shell pwd)
USER = bot
PRIVUSER = root
SERVER = smidgeo
SSHCMD = ssh $(USER)@$(SERVER)
PRIVSSHCMD = ssh $(PRIVUSER)@$(SERVER)
PROJECTNAME = godtributes
APPDIR = /opt/$(PROJECTNAME)


test: test-exhort test-analyze-tweet-images
	$(MOCHACMD) tests/tributedemander-tests.js

test-exhort:
	$(MOCHA) --R spec tests/exhort-tests.js -t 6000
	node tests/exhort-image-tests.js

test-exhort-integration:
	node tests/integration/exhort-tweet-test.js

test-chronicler-stress:
	node tests/integration/chronicler-stress-test.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js

test-analyze-tweet-images:
	node tests/analyze-tweet-images-tests.js

start-exhortation-server:
	service godtributes start

stop-exhortation-server:
	service godtributes stop

npm-install:
	cd $(HOMEDIR)
	npm install
	npm prune

sync:
	rsync -a $(HOMEDIR) $(USER)@$(SERVER):/opt/ --exclude node_modules/ --exclude data/
	$(SSHCMD) "cd  $(APPDIR) && chmod u+x exhortationserver.js && \
	npm prune && npm install"
	$(PRIVSSHCMD) "systemctl restart $(PROJECTNAME)"

check-status:
	$(SSHCMD) "systemctl status $(PROJECTNAME)"

check-log:
	$(SSHCMD) "journalctl -r -u $(PROJECTNAME)"

stop:
	$(PRIVSSHCMD) "service godtributes stop"

start:
	$(PRIVSSHCMD) "service godtributes start"

# The idea is for the repo's post-receive hook to simply be:
# cd /var/www/godtributes && make post-receive

install-logrotate-conf:
	cp $(HOMEDIR)/admin/logrotate.conf_entry /etc/logrotate.d/godtributes

# Probably need sudo for this.
install-service:
	$(PRIVSSHCMD) "cp $(APPDIR)/$(PROJECTNAME).service /etc/systemd/system && \
	systemctl daemon-reload"
	# systemctl enable godtributes
	# systemctl start godtributes

tribute:
	node maketribute.js

update-iscool-and-chime-in:
	git pull origin master && \
		npm update --save iscool && \
		npm update --save can-i-chime-in && \
		git commit -a -m"Updated iscool and can-i-chime-in." && \
		make pushall

pushall: sync
	git push origin master

lint:
	./node_modules/.bin/eslint .
