---
title: Eval Service Setup
layout: post
date: 2017-09-18 23:59:59
permalink: part-six-eval-service-setup
intro: false
part: 6
lesson: 2
share: true
---

In this lesson, we'll quickly wire up a new service...

---

In the next few lessons we'll spin up a new microservice that is responsible for maintaining exercises and keeping track of user scores.

Start by cloning down the repo containing the project boilerplate:

```sh
$ git clone https://github.com/realpython/flask-microservices-eval  \
  --branch v0 --single-branch
```

Then, check out the [v0](https://github.com/realpython/flask-microservices-eval/releases/tag/v0) tag to the master branch and install the dependencies:

```sh
$ git checkout tags/v0 -b master
```

Open the project in your code editor of choice, and quickly review the code. Then, within the *flask-microservices-main* project, add the service to *docker-compose.yml*:

```yaml
eval-service:
  container_name: eval-service
  build:
    context: ../flask-microservices-eval
    dockerfile: Dockerfile-local
  volumes:
    - '../flask-microservices-eval:/usr/src/app'
  ports:
    - 5002:5000 # expose ports - HOST:CONTAINER
  environment:
    - APP_SETTINGS=project.config.DevelopmentConfig
    - USERS_SERVICE_URL=http://users-service:5000
  depends_on:
    users-service:
      condition: service_started
  links:
    - users-service
```

Take note of the `USERS_SERVICE_URL` above. Then, jump to the `ensure_authenticated` function in *flask-microservices-eval/project/api/utils.py*:

```python
def ensure_authenticated(token):
    if current_app.config['TESTING']:
        return True
    url = '{0}/auth/status'.format(current_app.config['USERS_SERVICE_URL'])
    bearer = 'Bearer {0}'.format(token)
    headers = {'Authorization': bearer}
    response = requests.get(url, headers=headers)
    data = json.loads(response.text)
    if response.status_code == 200 and \
       data['status'] == 'success' and \
       data['data']['active']:
        return data
    else:
        return False
```

In this case, we'll make a request from one container to another so we need to reference the container name rather than the Docker Machine IP.

> Did you notice that we simply return `True` in the `ensure_authenticated` function in test mode? It's probably better to [mock](https://stackoverflow.com/questions/3459287/whats-the-difference-between-a-mock-stub) the `authenticate` function in the test suite to separate the source code from the test code. Refactor on your own.

Next, to spin up the containers, first set `dev` as the active machine:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```

Set the environment variables:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP:5001
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
```

Fire up the containers:

```sh
$ docker-compose up -d --build
```

Update *test.sh*:

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

docker-compose run eval-service python manage.py test
inspect $? eval-service

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

Run the tests:

```sh
$ sh test.sh
```
