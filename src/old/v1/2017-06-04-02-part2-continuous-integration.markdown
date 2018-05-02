---
title: Continuous Integration
layout: post
date: 2017-06-04 23:59:58
permalink: part-two-continuous-integration
intro: false
part: 2
lesson: 4
share: true
---

In this lesson, we'll add continuous integration (CI), via [Travis CI](http://travis-ci.org), to our projects...

---

Follow the [Getting Started guide](https://docs.travis-ci.com/user/getting-started/) (steps 1 and 2) to enable Travis in the *flask-microservices-users* project. To trigger a build, add a *.travis.yml* to the project root:

```yaml
language: python

python:
  - "3.6"

service:
  - postgresql

install:
  - pip install -r requirements.txt

before_script:
  - export APP_SETTINGS="project.config.TestingConfig"
  - export DATABASE_TEST_URL=postgresql://postgres:@localhost/users_test
  - psql -c 'create database users_test;' -U postgres
  - python manage.py recreate_db

script:
  - python manage.py test
```

Commit your changes, and then push to GitHub. This should trigger a new build, which should pass. For now, while the project structure is still somewhat simple, we'll use the following workflow:

1. Code new feature locally
1. Commit and push code
1. Ensure tests pass on Travis

With that, let's turn to *flask-microservices-main*. We need to get CI configured in this project as well. Here, we'll test out all services with Docker.

Enable Travis, and add a a *.travis.yml* file:

```yaml
sudo: required

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
  - docker-compose up --build -d

script:
  - docker-compose run users-service python manage.py test

after_script:
  - docker-compose down
```

Commit. Push to GitHub. Make sure the build passes before moving on.
