---
title: Continuous Integration
layout: post
permalink: part-two-continuous-integration
intro: false
part: 2
lesson: 3
share: true
---

Next, we'll add continuous integration (CI), via [Travis CI](https://travis-ci.org/), to our projects...

---

Follow steps 1 and 2 of the [Getting Started guide](https://docs.travis-ci.com/user/getting-started/#To-get-started-with-Travis-CI) guid to enable Travis in the project.

To trigger a build, add a *.travis.yml* to the project root:

```yaml
sudo: required

services:
  - docker

env:
  DOCKER_COMPOSE_VERSION: 1.14.0

before_install:
  - sudo rm /usr/local/bin/docker-compose
  - curl -L https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > docker-compose
  - chmod +x docker-compose
  - sudo mv docker-compose /usr/local/bin

before_script:
  - docker-compose -f docker-compose-dev.yml up --build -d

script:
  - docker-compose -f docker-compose-dev.yml run users-service python manage.py test
  - docker-compose -f docker-compose-dev.yml run users-service flake8 project

after_script:
  - docker-compose -f docker-compose-dev.yml down
```

Commit your changes, and then push to GitHub. This *should* trigger a new build, which *should* pass. Once done, be sure to add a *README.md* file to the project root, adding the Travis status badge:

```
# Microservices with Docker, Flask, and React

[![Build Status](https://travis-ci.org/YOUR_GITHUB_USERNAME/testdriven-app.svg?branch=master)](https://travis-ci.org/YOUR_GITHUB_USERNAME/testdriven-app)
```

> Be sure to replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

In terms of workflow, for now, while the project structure is still somewhat simple, we'll:

1. Code a new feature locally
1. Commit and push code
1. Ensure tests pass on Travis
