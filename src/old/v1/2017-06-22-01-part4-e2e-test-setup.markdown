---
title: End-to-End Test Setup
layout: post
date: 2017-06-22 23:59:59
permalink: part-four-e2e-test-setup
intro: false
part: 4
lesson: 2
share: true
---

In this lesson, we'll set up e2e testing with TestCafe...

---

Before adding TestCafe into the mix, let's simplify the running of tests within the *flask-microservices-main* project.

Start by setting `dev` as the active machine:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```

Set the environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

Update the containers:

```sh
$ docker-compose up -d
```

Ensure the app is working in the browser, and then run the tests:

```sh
$ docker-compose run users-service python manage.py test
```

Once done, add a new file to the project root called *test.sh*:

```sh
#!/bin/bash

fails=''

inspect() {
  if [ $1 -ne 0 ]; then
    fails="${fails} $2"
  fi
}

docker-compose run users-service python manage.py test
inspect $? users-service

if [ -n "${fails}" ];
  then
    echo "Tests failed: ${fails}"
    exit 1
  else
    echo "Tests passed!"
    exit 0
fi
```

Here, we run the tests, calculate the number of failures (via the `inspect` function), and then exit with the proper [code](http://tldp.org/LDP/abs/html/exitcodes.html).

Run the tests to ensure all is well:

```sh
$ sh test.sh
```

Update the `script` in *.travis.yml*:

```yaml
script:
  - sh test.sh
```

Commit and push your code to ensure the tests still pass on Travis.

#### <span style="font-family:'Montserrat', 'sans-serif';">TestCafe</span>

Unlike the majority of other end-to-end (e2e) testing tools, [TestCafe](https://github.com/DevExpress/testcafe) is not dependent on Selenium or WebDriver. Instead, it injects scripts into the browser to communicate directly with the DOM and handle events. It works on any modern browser that supports HTML5 without any plugins.

> Please review the [Getting Started](http://devexpress.github.io/testcafe/documentation/getting-started/) guide before beginning.

To install, first add a *[package.json](https://docs.npmjs.com/files/package.json)* to the project root:

```json
{
  "name": "flask-microservices-main"
}
```

Then install the dependency:

```sh
$ npm install testcafe@0.16.1 --save
```

The `--save` flag adds the dependency info to the *package.json*:

```sh
{
  "name": "flask-microservices-main",
  "dependencies": {
    "testcafe": "^0.16.1"
  }
}
```

The dependency (and sub dependencies) were installed to a newly created "node_modules" directory. Add this directory to the *.gitignore* file.

Let's write our first test spec!

#### <span style="font-family:'Montserrat', 'sans-serif';">First Test</span>

First, add a new folder to the project root called "e2e". Then add a new file to that folder called *index.test.js*:

```javascript
import { Selector } from 'testcafe';

const TEST_URL = process.env.TEST_URL;


fixture('/').page(`${TEST_URL}/`);

test(`users should be able to view the '/' page`, async (t) => {

  await t
    .navigateTo(TEST_URL)
    .expect(Selector('H1').withText('All Users').exists).ok()

});
```

This test simply navigates to the main URL, `/`, and then asserts that an `H1` element exists with the text `All Users`.

Set the environment variable:

```sh
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
```

Run the tests:

```sh
$ testcafe chrome e2e
```

You should see a new Chrome window open, which navigates to the main page and then TestCafe runs the assertion.

In the terminal, you should see something like:

```sh
$ testcafe chrome e2e
Using locally installed version of TestCafe.
 Running tests in:
 - Chrome 58.0.3029 / Mac OS X 10.11.6

 /
 users should be able to view the '/' page


 1 passed (1s)
 ```

Experiment with this. Try [navigating](http://devexpress.github.io/testcafe/documentation/test-api/actions/navigate.html) to a different page. Add a [click action](http://devexpress.github.io/testcafe/documentation/test-api/actions/click.html). Set up additional [selectors](http://devexpress.github.io/testcafe/documentation/test-api/selecting-page-elements/selectors.html) and run some more assertions.

#### <span style="font-family:'Montserrat', 'sans-serif';">CI</span>

Add the test to the *test.sh* file:

```sh
#!/bin/bash

fails=''

inspect() {
  if [ $1 -ne 0 ]; then
    fails="${fails} $2"
  fi
}

docker-compose run users-service python manage.py test
inspect $? users-service

testcafe chrome e2e
inspect $? e2e

if [ -n "${fails}" ];
  then
    echo "Tests failed: ${fails}"
    exit 1
  else
    echo "Tests passed!"
    exit 0
fi
```

Make sure the tests pass again, and then update *.travis.yml* like so:

```yaml
language: node_js
node_js: '7'

before_install:
  - stty cols 80

dist: trusty
sudo: required

addons:
  apt:
    sources:
     - google-chrome
    packages:
     - google-chrome-stable

services:
  - docker

env:
  global:
    - DOCKER_COMPOSE_VERSION=1.11.2

before_install:
  - sudo rm /usr/local/bin/docker-compose
  - curl -L https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > docker-compose
  - chmod +x docker-compose
  - sudo mv docker-compose /usr/local/bin

before_script:
  - export TEST_URL=http://127.0.0.1
  - export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1
  - export DISPLAY=:99.0
  - sh -e /etc/init.d/xvfb start
  - sleep 3
  - docker-compose up --build -d

script:
  - docker-compose run users-service python manage.py test
  - testcafe chrome e2e/index.test.js

after_script:
  - docker-compose down
```

Here, we added the Node version along with some basic Chrome settings. Also, we have to use [xvfb](https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-xvfb-to-Run-Tests-That-Require-a-GUI) to fake a GUI so that Chrome thinks it's running in a graphical environment.

> Review the [Running Tests in Firefox and Chrome Using Travis CI](http://devexpress.github.io/testcafe/documentation/recipes/running-tests-in-firefox-and-chrome-using-travis-ci.html) for more info.

Commit your code and push it up to GitHub. Make sure the tests pass on Travis.
