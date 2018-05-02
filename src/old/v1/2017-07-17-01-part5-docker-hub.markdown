---
title: Docker Hub
layout: post
date: 2017-07-17 23:59:59
permalink: part-five-docker-hub
intro: false
part: 5
lesson: 2
share: true
---

Let's update the CI process to include [Docker Hub](https://docs.docker.com/docker-hub/), an image registry:

1. Create a new feature branch
1. Open PR against the `master` branch
1. New build is triggered on Travis
1. If the tests pass, images are created and pushed to Docker Hub

#### <span style="font-family:'Montserrat', 'sans-serif';">Docker Hub</span>

[Docker Hub](https://docs.docker.com/docker-hub/) is an image registry, which is simply a service that stores Docker images - basically GitHub for Docker images.

> Review the following Stack Overflow [article](https://stackoverflow.com/a/34004418/1799408) for more info on Docker Hub and image registries in general.

Sign up for [Docker Hub](https://hub.docker.com/) (if necessary), and then define the following environment variables within the [Repository Settings](https://docs.travis-ci.com/user/environment-variables/#Defining-Variables-in-Repository-Settings) for *flask-microservices-main*:

1. DOCKER_EMAIL - YOUREMAILATSOMETHING.COM
1. DOCKER_ID - YOUR_ID/USERNAME
1. DOCKER_PASSWORD - YOUR_PASSWORD

Next, create four new repositories on Docker Hub:

1. *flask-microservices-users*
1. *flask-microservices-users_db*
1. *flask-microservices-client*
1. *flask-microservices-swagger*
1. *flask-microservices-nginx*

> Keep in mind that we will be storing these repositories publicly so do not add any sensitive info to the images on the build.

#### <span style="font-family:'Montserrat', 'sans-serif';">Users</span>

Let's update the *.travis.yml* file in *flask-microservices-main*:

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
    - COMMIT=${TRAVIS_COMMIT::8}
    - USERS=flask-microservices-users
    - USERS_REPO=https://github.com/realpython/$USERS.git

before_install:
  - sudo rm /usr/local/bin/docker-compose
  - curl -L https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > docker-compose
  - chmod +x docker-compose
  - sudo mv docker-compose /usr/local/bin

before_script:
  - export TEST_URL=http://127.0.0.1
  - export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1
  - export SECRET_KEY=my_precious
  - export DISPLAY=:99.0
  - sh -e /etc/init.d/xvfb start
  - sleep 3
  - docker-compose -f docker-compose-ci.yml up -d --build

script:
  - docker-compose -f docker-compose-ci.yml run users-service python manage.py test
  - docker-compose -f docker-compose-ci.yml run users-service python manage.py recreate_db
  - testcafe chrome e2e

after_script:
  - docker-compose down

after_success:
  - docker login -e $DOCKER_EMAIL -u $DOCKER_ID -p $DOCKER_PASSWORD
  - export TAG=`if [ "$TRAVIS_BRANCH" == "master" ]; then echo "latest"; else echo $TRAVIS_BRANCH ; fi`
  # users
  - docker build $USERS_REPO -t $USERS:$COMMIT
  - docker tag $USERS:$COMMIT $DOCKER_ID/$USERS:$TAG
  - docker push $DOCKER_ID/$USERS
```

What changed?

1. Environment variables:
    1. `COMMIT=${TRAVIS_COMMIT::8}` - sets a new environment variable, called `COMMIT`, which contains the first 8 characters of the git commit hash.
    1. `USERS` - defines the name of the Git repo and image name.
    1. `USERS_REPO` - defines the full GitHub URL.
1. Finally, within `after_success`, we login to the Docker Hub registry, generate a tag based on the branch name, build an image from the *Dockerfile*, tag the image, and then push the image to Docker Hub.

> Update the value of `USERS_REPO` to your repo.

We also referenced a new Docker Compose file, *docker-compose-ci.yml*:

```yaml
version: '2.1'

services:

  users-db:
    container_name: users-db
    build:
      context: https://github.com/realpython/flask-microservices-users.git#master:project/db
    ports:
      - 5435:5432  # expose ports - HOST:CONTAINER
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: exit 0

  users-service:
    container_name: users-service
    build:
      context: https://github.com/realpython/flask-microservices-users.git
    expose:
      - '5000'
    environment:
      - APP_SETTINGS=project.config.StagingConfig
      - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_staging
      - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      users-db:
        condition: service_healthy
    links:
      - users-db
    command: gunicorn -b 0.0.0.0:5000 manage:app

  nginx:
    container_name: nginx
    build: ./nginx/
    restart: always
    ports:
      - 80:80
    depends_on:
      users-service:
        condition: service_started
      web-service:
        condition: service_started
    links:
      - users-service
      - web-service

  web-service:
    container_name: web-service
    build:
      context: https://github.com/realpython/flask-microservices-client.git
      args:
        - NODE_ENV=development
        - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
    ports:
      - '9000:9000' # expose ports - HOST:CONTAINER
    depends_on:
      users-service:
        condition: service_started
    links:
      - users-service

  swagger:
    container_name: swagger
    build:
      context: https://github.com/realpython/flask-microservices-swagger.git
    ports:
      - '8080:8080' # expose ports - HOST:CONTAINER
    environment:
      - API_URL=https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger.json
    depends_on:
      users-service:
        condition: service_started
```

To test, commit your code and then push to GitHub. Make sure the build passes on Travis and that a new [tag](https://docs.docker.com/docker-hub/repos/#viewing-repository-tags) was added to Docker Hub.

#### <span style="font-family:'Montserrat', 'sans-serif';">Users DB</span>

For the users database, add the environment variables to *.travis.yml*:

```yaml
- USERS_DB=flask-microservices-users_db
- USERS_DB_REPO=https://github.com/realpython/$USERS.git#master:project/db
```

Then add the following to `after_success`:

```yaml
# users db
- docker build $USERS_DB_REPO -t $USERS_DB:$COMMIT
- docker tag $USERS_DB:$COMMIT $DOCKER_ID/$USERS_DB:$TAG
- docker push $DOCKER_ID/$USERS_DB
```

Commit, push, and ensure all is well.

For each of the next three services, we need to make the updates to *.travis.yml*, commit and push the code, and then ensure the build passes and the tag is added to Docker Hub....

#### <span style="font-family:'Montserrat', 'sans-serif';">Web</span>

Environment variables:

```yaml
- CLIENT=flask-microservices-client
- CLIENT_REPO=https://github.com/realpython/$CLIENT.git
```

`after_success`:

```yaml
# client
- docker build $CLIENT_REPO -t $CLIENT:$COMMIT
- docker tag $CLIENT:$COMMIT $DOCKER_ID/$CLIENT:$TAG
- docker push $DOCKER_ID/$CLIENT
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Swagger</span>

Environment variables:

```yaml
- SWAGGER=flask-microservices-swagger
- SWAGGER_REPO=https://github.com/realpython/$SWAGGER.git
```

`after_success`:

```yaml
# swagger
- docker build $SWAGGER_REPO -t $SWAGGER:$COMMIT
- docker tag $SWAGGER:$COMMIT $DOCKER_ID/$SWAGGER:$TAG
- docker push $DOCKER_ID/$SWAGGER
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Nginx</span>

Environment variables:

```yaml
- NGINX=flask-microservices-nginx
- NGINX_REPO=https://github.com/realpython/flask-microservices-main.git#master:nginx
```

`after_success`:

```yaml
# nginx
- docker build $NGINX_REPO -t $NGINX:$COMMIT
- docker tag $NGINX:$COMMIT $DOCKER_ID/$NGINX:$TAG
- docker push $DOCKER_ID/$NGINX
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Scripts</span>

Since we only want the `after_success` to run when the branch is `master`, let's create a simple shell script:

```sh
#!/bin/sh

if [ "$TRAVIS_BRANCH" == "master" ]; then
  docker login -e $DOCKER_EMAIL -u $DOCKER_ID -p $DOCKER_PASSWORD
  export TAG=`if [ "$TRAVIS_BRANCH" == "master" ]; then echo "latest"; else echo $TRAVIS_BRANCH ; fi`
  # users
  docker build $USERS_REPO -t $USERS:$COMMIT
  docker tag $USERS:$COMMIT $DOCKER_ID/$USERS:$TAG
  docker push $DOCKER_ID/$USERS
  # users db
  docker build $USERS_DB_REPO -t $USERS_DB:$COMMIT
  docker tag $USERS_DB:$COMMIT $DOCKER_ID/$USERS_DB:$TAG
  docker push $DOCKER_ID/$USERS_DB
  # client
  docker build $CLIENT_REPO -t $CLIENT:$COMMIT
  docker tag $CLIENT:$COMMIT $DOCKER_ID/$CLIENT:$TAG
  docker push $DOCKER_ID/$CLIENT
  # swagger
  docker build $SWAGGER_REPO -t $SWAGGER:$COMMIT
  docker tag $SWAGGER:$COMMIT $DOCKER_ID/$SWAGGER:$TAG
  docker push $DOCKER_ID/$SWAGGER
  # nginx
  docker build $NGINX_REPO -t $NGINX:$COMMIT
  docker tag $NGINX:$COMMIT $DOCKER_ID/$NGINX:$TAG
  docker push $DOCKER_ID/$NGINX
fi
```

Save this as *docker_push.sh* within *flask-microservices-main*, and then update `after_success`:

```yaml
after_success:
  - bash ./docker_push.sh
```

We can speed up the building of new images by first pulling in the latest image from Docker Hub. Add a new script called *docker_build.sh* to the project root:

```sh
#!/bin/sh

docker login -e $DOCKER_EMAIL -u $DOCKER_ID -p $DOCKER_PASSWORD
docker pull $DOCKER_ID/$USERS
docker pull $DOCKER_ID/$USERS_DB
docker pull $DOCKER_ID/$CLIENT
docker pull $DOCKER_ID/$SWAGGER
docker pull $DOCKER_ID/$NGINX

docker-compose -f docker-compose-ci.yml up -d --build
```

> Want to speed things up even more? [Cache images on Travis](https://github.com/start-jsk/jsk_apc/commit/7c12afa1c8c460f1b148c6ca887203d915fa9846).

Update the `before_script` in *.travis.yml*:

```yaml
before_script:
  - export TEST_URL=http://127.0.0.1
  - export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1
  - export SECRET_KEY=my_precious
  - export DISPLAY=:99.0
  - sh -e /etc/init.d/xvfb start
  - sleep 3
  - bash ./docker_build.sh
```

To test create a new branch feature branch and push your code to GitHub. A new build should be triggered, but it should not run any code within the `if` block within *docker_push.sh*. Merge your code to master in GitHub, which will trigger another new build on Travis. This time, the script should fire.

#### <span style="font-family:'Montserrat', 'sans-serif';">Architecture</span>

| Name             | Repo | Image |  Container | Tech         |
|------------------|------|-------|------------|--------------|
| Users API | [users](https://github.com/realpython/flask-microservices-users) | [users](https://hub.docker.com/r/realpython/flask-microservices-users) | `users-service` | Flask, gunicorn  |
| Users DB | [users](https://github.com/realpython/flask-microservices-users/tree/master/project/db) | [users_db](https://hub.docker.com/r/realpython/flask-microservices-users_db) | `users-db` | Postgres  |
| Client | [client](https://github.com/realpython/flask-microservices-client) | [client](https://hub.docker.com/r/realpython/flask-microservices-client) | `web-service` | React, React-Router  |
| Swagger | [swagger](https://github.com/realpython/flask-microservices-swagger) | [swagger](https://hub.docker.com/r/realpython/flask-microservices-swagger) | `swagger` | Swagger UI  |
| e2e Tests | [main](https://github.com/realpython/flask-microservices-main/tree/master/e2e) | N/A | N/A | TestCafe  |
| Nginx | [main](https://github.com/realpython/flask-microservices-main/tree/master/nginx) | [nginx](https://hub.docker.com/r/realpython/flask-microservices-nginx) | `nginx` | Nginx  |
