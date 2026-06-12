all: deploy

build:
	pxt build
	cp built/debug/binary.js assets/js/binary.js

deploy:
	pxt deploy

test:
	pxt test
