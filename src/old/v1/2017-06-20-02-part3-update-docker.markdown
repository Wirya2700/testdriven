---
title: Update Docker
layout: post
date: 2017-06-20 23:59:59
permalink: part-three-update-docker
intro: false
part: 3
lesson: 11
share: true
---

In this last lesson, we'll update Docker locally and on AWS, since we've been working outside of Docker this entire part thus far...

---

Start by committing and pushing your code up to GitHub for both *flask-microservices-client* and *flask-microservices-users*. Make sure the tests pass on Travis for the latter project.

Next, add the `SECRET_KEY` to the `users-service` in the *docker-compose.yml* in *flask-microservices-main*:

```yaml
users-service:
  container_name: users-service
  build: https://github.com/realpython/flask-microservices-users.git
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
```

Update the Nginx config in *nginx/nginx.conf*:

```
server {

    listen 80;

    location / {
        proxy_pass http://web-service:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /users {
        proxy_pass http://users-service:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ping {
        proxy_pass http://users-service:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /auth {
        proxy_pass http://users-service:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

}
```

Commit your code and push it to GitHub. This should trigger a new build on Travis. Make sure it passes.

To test locally, set `dev` as the active machine:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```

Set the environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

Then re-build the images and fire up the containers:

```sh
$ docker-compose up -d --build
```

Once the containers are up, update and then seed the database:

```sh
$ docker-compose run users-service python manage.py recreate_db
$ docker-compose run users-service python manage.py seed_db
```

Test it out in the browser, and then run the tests:

```sh
$ docker-compose run users-service python manage.py test
```

Time for production. Change the machine:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
```

Again, we need to add the `SECRET_KEY` environment variable to the `users-service`.

*docker-compose-prod.yml*:

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
    users-db:
      condition: service_healthy
  links:
    - users-db
  command: gunicorn -b 0.0.0.0:5000 manage:app
```

Since this should truly be random, we'll set the key locally and pull it into the container at the build time.

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

Grab the IP for the `aws` machine and use it for the `REACT_APP_USERS_SERVICE_URL` environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_AWS_IP
```

Update the containers, re-create and seed the database, and run the tests:

```sh
$ docker-compose -f docker-compose-prod.yml up -d --build
$ docker-compose -f docker-compose-prod.yml run users-service python manage.py recreate_db
$ docker-compose -f docker-compose-prod.yml run users-service python manage.py seed_db
$ docker-compose -f docker-compose-prod.yml run users-service python manage.py test
```

Test it in the browser one last time. Commit and push your code.
