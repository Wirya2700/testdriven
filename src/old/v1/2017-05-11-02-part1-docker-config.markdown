---
title: Docker Config
layout: post
date: 2017-05-11 23:59:59
permalink: part-one-docker-config
intro: false
part: 1
lesson: 3
share: true
---

Let's containerize the Flask app...

---

Start by ensuring that you have Docker, Docker Compose, and Docker Machine installed:

```sh
$ docker -v
Docker version 17.03.1-ce, build c6d412e
$ docker-compose -v
docker-compose version 1.11.2, build dfed245
$ docker-machine -v
docker-machine version 0.10.0, build 76ed2a6
```

Next, we need to [create](https://docs.docker.com/machine/reference/create/) a new Docker host with [Docker Machine](https://docs.docker.com/machine/) and point the Docker client at it:

```sh
$ docker-machine create -d virtualbox dev
$ eval "$(docker-machine env dev)"
```

> Learn more about the above command [here](https://stackoverflow.com/questions/40038572/eval-docker-machine-env-default/40040077#40040077).

Add a *Dockerfile* to the root directory, making sure to review the code comments:

```
FROM python:3.6.1

# set working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# add requirements (to leverage Docker cache)
ADD ./requirements.txt /usr/src/app/requirements.txt

# install requirements
RUN pip install -r requirements.txt

# add app
ADD . /usr/src/app

# run server
CMD python manage.py runserver -h 0.0.0.0
```

Then add a *docker-compose.yml* file to the root:

```
version: '2.1'

services:

  users-service:
    container_name: users-service
    build: .
    volumes:
      - '.:/usr/src/app'
    ports:
      - 5001:5000 # expose ports - HOST:CONTAINER
```

This config will create a container called `users-service`, from the Dockerfile.

> Directories are relative to the *docker-compose.yml* file.

The `volume` is used to mount the code into the container. This is a must for a development environment in order to update the container whenever a change to the source code is made. Without this, you would have to re-build the image after each code change.

Take note of the [Docker compose file version](https://docs.docker.com/compose/compose-file/) used - `2.1`. Keep in mind that this does *not* relate directly to the version of Docker Compose installed - it simply specifies the file format that you want to use.

Build the image:

```sh
$ docker-compose build
```

This will take a few minutes the first time. Subsequent builds will be much faster since Docker caches the results of the first build. Once done, fire up the container:

```sh
$ docker-compose up -d
```

> The `-d` flag is used to run the containers in the background.

Grab the IP associated with the machine:

```sh
$ docker-machine ip dev
```

Navigate to [http://YOUR-IP:5001/ping](http://YOUR-IP:5001/ping). Make sure you see the same JSON response as before. Next, add an environment variable to the *docker-compose.yml* file to load the app config for the dev environment:

```
version: '2.1'

services:

  users-service:
    container_name: users-service
    build: .
    volumes:
      - '.:/usr/src/app'
    ports:
      - 5001:5000 # expose ports - HOST:CONTAINER
    environment:
      - APP_SETTINGS=project.config.DevelopmentConfig
```

Then update *project/\_\_init\_\_.py*, to pull in the environment variables:

```python
# project/__init__.py


import os
from flask import Flask, jsonify


# instantiate the app
app = Flask(__name__)

# set config
app_settings = os.getenv('APP_SETTINGS')
app.config.from_object(app_settings)


@app.route('/ping', methods=['GET'])
def ping_pong():
    return jsonify({
        'status': 'success',
        'message': 'pong!'
    })
```

Update the container:

```sh
$ docker-compose up -d
```

Want to test? Add a `print` statement to the *\_\_init\_\_.py*, right before the route handler, to view the app config to ensure that it is working:

```python
import sys
print(app.config, file=sys.stderr)
```

Then just view the logs:

```sh
$ docker-compose logs -f users-service
```

You should see something like:

```
<Config {
  'DEBUG': True, 'TESTING': False, 'PROPAGATE_EXCEPTIONS': None,
  'PRESERVE_CONTEXT_ON_EXCEPTION': None, 'SECRET_KEY': None,
  'PERMANENT_SESSION_LIFETIME': datetime.timedelta(31), 'USE_X_SENDFILE':
  False, 'LOGGER_NAME': 'project', 'LOGGER_HANDLER_POLICY': 'always',
  'SERVER_NAME': None, 'APPLICATION_ROOT': None, 'SESSION_COOKIE_NAME':
  'session', 'SESSION_COOKIE_DOMAIN': None, 'SESSION_COOKIE_PATH': None,
  'SESSION_COOKIE_HTTPONLY': True, 'SESSION_COOKIE_SECURE': False,
  'SESSION_REFRESH_EACH_REQUEST': True, 'MAX_CONTENT_LENGTH': None,
  'SEND_FILE_MAX_AGE_DEFAULT': datetime.timedelta(0, 43200),
  'TRAP_BAD_REQUEST_ERRORS': False, 'TRAP_HTTP_EXCEPTIONS': False,
  'EXPLAIN_TEMPLATE_LOADING': False, 'PREFERRED_URL_SCHEME': 'http',
  'JSON_AS_ASCII': True, 'JSON_SORT_KEYS': True,
  'JSONIFY_PRETTYPRINT_REGULAR': True, 'JSONIFY_MIMETYPE':
  'application/json', 'TEMPLATES_AUTO_RELOAD': None}
>
```

Make sure to remove the `print` statement before moving on.
