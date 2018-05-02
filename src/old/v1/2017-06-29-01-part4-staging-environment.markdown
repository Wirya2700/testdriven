---
title: Staging Environment
layout: post
date: 2017-06-29 23:59:59
permalink: part-four-staging-environment
intro: false
part: 4
lesson: 8
share: true
---

In this lesson, we'll set up a staging environment on AWS...

---

It's important to test applications out in an environment as close to production as possible when deploying to avoid hitting unexpected environment-specific bugs. Docker containers help to eliminate much of the disparity between development and production, but problems can (and will) still arise. So, let's set up a staging environment.

#### <span style="font-family:'Montserrat', 'sans-serif';">Staging</span>

Create a new Docker machine:

```sh
$ docker-machine create --driver amazonec2 staging
```

While the new EC2 instance is being provisioned, create a new file called *docker-compose-staging.yml*:

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

Take note of any changes, and then commit and push your code to GitHub. Next, update *flask-microservices-users/project/db/create.sql*:

```sql
CREATE DATABASE users_prod;
CREATE DATABASE users_staging;
CREATE DATABASE users_dev;
CREATE DATABASE users_test;
```

Then add a `StagingConfig` to *flask-microservices-users/project/config.py*:

```python
class StagingConfig(BaseConfig):
    """Staging configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
```

Commit and push your code, and then change the machine to `staging` with *flask-microservices-main*:

```sh
$ docker-machine env staging
$ eval $(docker-machine env staging)
```

Let's create a new secret key. Open the Python shell and run:

```python
>>> import os
>>> import binascii
>>> binascii.hexlify(os.urandom(24))
b'b476f58095eae2db74ce721a48c88ab2385e942688f7ddab'
```

Exit the shell. Set it as an environment variable:

```sh
$ export SECRET_KEY=b476f58095eae2db74ce721a48c88ab2385e942688f7ddab
```

Grab the IP for the `staging` machine and use it for the `REACT_APP_USERS_SERVICE_URL` environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_STAGING_IP
```

Spin up the containers, create and seed the database, and run the tests:

```sh
$ docker-compose -f docker-compose-staging.yml \
  up -d --build
$ docker-compose -f docker-compose-staging.yml \
  run users-service \
  python manage.py db upgrade
$ docker-compose -f docker-compose-staging.yml \
  run users-service \
  python manage.py seed_db
```

Run the users service tests:

```sh
$ docker-compose -f docker-compose-staging.yml run users-service python manage.py test
```

Set the `TEST_URL` variable for the end-to-end tests:

```sh
$ export TEST_URL=http://DOCKER_MACHINE_STAGING_IP
```

Run the end-to-end tests:

```sh
$ testcafe chrome e2e
```

You also need to add port 8080 to the [Security Group](http://stackoverflow.com/questions/26338301/ec2-how-to-add-port-8080-in-security-group) since Swagger is listening on that port.

#### <span style="font-family:'Montserrat', 'sans-serif';">Travis</span>

Next, update the `before_script` and `script` within the *.travis.yml* file to use the *docker-compose-staging.yml* file for the build and test run:

```yaml
before_script:
  - export TEST_URL=http://127.0.0.1
  - export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1
  - export SECRET_KEY=my_precious
  - export DISPLAY=:99.0
  - sh -e /etc/init.d/xvfb start
  - sleep 3
  - docker-compose -f docker-compose-staging.yml up -d --build

script:
  - docker-compose -f docker-compose-staging.yml run users-service python manage.py test
  - docker-compose -f docker-compose-staging.yml run users-service python manage.py recreate_db
  - testcafe chrome e2e
```

Commit and push your code. Make sure the tests pass on Travis.

#### <span style="font-family:'Montserrat', 'sans-serif';">Production</span>

Let's update production with the changes from this part thus far. Start by adding swagger to *docker-compose-prod.yml*:

```yaml
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

Switch to the prod machine:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
```

Grab the IP for the machine and use it for the REACT_APP_USERS_SERVICE_URL environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_AWS_IP
```

Update:

```sh
$ docker-compose -f docker-compose-prod.yml up -d --build
```

Ensure all is well.

#### <span style="font-family:'Montserrat', 'sans-serif';">Local</span>

To simplify local development, let's make a few changes to the *docker-compose.yml* file:

```yaml
version: '2.1'

services:

  users-db:
    container_name: users-db
    build:
      context: ../flask-microservices-users/project/db
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
      context: ../flask-microservices-users
      dockerfile: Dockerfile-local
    volumes:
      - '../flask-microservices-users:/usr/src/app'
    ports:
      - 5001:5000 # expose ports - HOST:CONTAINER
    environment:
      - APP_SETTINGS=project.config.DevelopmentConfig
      - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_dev
      - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
      - SECRET_KEY=my_precious
    depends_on:
      users-db:
        condition: service_healthy
    links:
      - users-db

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
      context: ../flask-microservices-client
      dockerfile: Dockerfile-local
    volumes:
      - '../flask-microservices-client:/usr/src/app'
      - '/usr/src/app/node_modules'
    ports:
      - '9000:9000' # expose ports - HOST:CONTAINER
    environment:
      - NODE_ENV=development
      - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
    depends_on:
      users-service:
        condition: service_started
    links:
      - users-service

  swagger:
    container_name: swagger
    build:
      context: ../flask-microservices-swagger
    ports:
      - '8080:8080' # expose ports - HOST:CONTAINER
    environment:
      - API_URL=https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger.json
    depends_on:
      users-service:
        condition: service_started
```

Not too many changes, right? We added volumes and are now referencing new, development-only *Dockerfiles* for the web and users service.

*flask-microservices-client/Dockerfile-local*:

```
FROM node:latest

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install react-scripts@0.9.5 -g --silent

# start app
CMD ["npm", "start"]
```

*flask-microservices-users/Dockerfile-local*:

```
FROM python:3.6.1

# set working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# add requirements (to leverage Docker cache)
ADD ./requirements.txt /usr/src/app/requirements.txt

# install requirements
RUN pip install -r requirements.txt

# run server
CMD python manage.py runserver -h 0.0.0.0
```

Also, you need to update the `start` script in *flask-microservices-client/package.json* to serve up the app on port 9000:

```json
"scripts": {
  "start": "PORT=9000 react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test --env=jsdom",
  "eject": "react-scripts eject"
}
```

To test, switch to the dev machine:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```

Grab the IP for the machine and use it for the REACT_APP_USERS_SERVICE_URL environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

Update:

```sh
$ docker-compose up -d --build
```

Commit and push your code!
