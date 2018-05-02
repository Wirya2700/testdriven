---
title: Flask Deployment
layout: post
date: 2017-06-05 23:59:59
permalink: part-two-flask-deployment
intro: false
part: 2
lesson: 6
share: true
---

Let's update the `users-service` container, locally and in production, and then test it with the local version of the React app running outside the container...

---

#### <span style="font-family:'Montserrat', 'sans-serif';">Development</span>

To update Docker, first commit and push your code for *flask-microserves-users* to GitHub (if necessary). Make sure the tests pass on Travis CI, and then navigate to *flask-microservices-main*.

Set the `dev` machine as the active machine and update the containers:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
$ docker-compose up -d --build
```

Make sure the tests pass:

```sh
$ docker-compose run users-service python manage.py test
```

Now we can test the React app against the Flask app running in the Docker Container:

1. Navigate to *flask-microservices-main* and grab the IP of the `dev` machine - `docker-machine ip dev`
1. Back in *flask-microservices-client*, update the environment variable with the IP - `export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_IP`
1. Fire up the app - `npm start` - and make sure it still works

#### <span style="font-family:'Montserrat', 'sans-serif';">Production</span>

Let's update and then test in production.

Within the *flask-microservices-main* project, set the `aws` machine as the active machine and update the containers:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
$ docker-compose -f docker-compose-prod.yml up -d --build
```

Just like before, test the React app against the Flask app:

1. Navigate to *flask-microservices-main* and grab the IP of the `aws` machine - `docker-machine ip aws`
1. Back in *flask-microservices-client*, update the environment variable with the IP - `export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_IP`
1. Fire up the app - `npm start` - and make sure it still works
