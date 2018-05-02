---
title: Update Docker
layout: post
permalink: part-three-update-docker
intro: false
part: 3
lesson: 13
share: true
---

In this last lesson, we'll update Docker on AWS...

---

Change the machine to `testdriven-prod`:

```sh
$ docker-machine env testdriven-prod
$ eval $(docker-machine env testdriven-prod)
```

We need to add the `SECRET_KEY` environment variable to the `users-service` in *docker-compose-prod.yml*:

```yaml
users-service:
  container_name: users-service
  build: https://github.com/realpython/flask-microservices-users.git
  expose:
    - '5000'
  environment:
    - APP_SETTINGS=project.config.ProductionConfig
    - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_prod
    - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
    - SECRET_KEY=${SECRET_KEY}
  depends_on:
    - users-db
  links:
    - users-db
  command: gunicorn -b 0.0.0.0:5000 manage:app
```

Since this key should truly be random, we'll set the key locally and pull it into the container at the build time.

To create a key, open the Python shell and run:

```python
>>> import binascii
>>> import os
>>> binascii.hexlify(os.urandom(24))
b'0ccd512f8c3493797a23557c32db38e7d51ed74f14fa7580'
```

Exit the shell. Set it as an environment variable:

```sh
$ export SECRET_KEY=0ccd512f8c3493797a23557c32db38e7d51ed74f14fa7580
```

Grab the IP for the `testdriven-prod` machine and use it for the `REACT_APP_USERS_SERVICE_URL` environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_AWS_IP
```

Then, update *services/client/Dockerfile-prod*, to install react-scripts:

```
FROM node:latest

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# add environment variables
ARG REACT_APP_USERS_SERVICE_URL
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
ENV REACT_APP_USERS_SERVICE_URL $REACT_APP_USERS_SERVICE_URL

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install pushstate-server -g --silent
RUN npm install react-scripts@1.0.15 -g --silent

# add app
ADD . /usr/src/app

# build react app
RUN npm run build

# start app
CMD ["pushstate-server", "build", "3000"]
```

Update the containers:

```sh
$ docker-compose -f docker-compose-prod.yml up -d --build
```

Re-create and seed the database:

```sh
$ docker-compose -f docker-compose-prod.yml \
  run users-service python manage.py recreate_db

$ docker-compose -f docker-compose-prod.yml \
  run users-service python manage.py seed_db
```

And run the tests:

```sh
$ docker-compose -f docker-compose-prod.yml \
  run users-service python manage.py test

$ docker-compose -f docker-compose-prod.yml \
  run users-service flake8 project

$ docker-compose -f docker-compose-prod.yml \
  run client npm test -- --verbose
```

Test it in the browser one last time. Commit and push your code.
