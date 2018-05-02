---
title: Postgres Setup
layout: post
permalink: part-one-postgres-setup
intro: false
part: 1
lesson: 6
share: true
---

In this lesson, we'll configure Postgres, get it up and running in another container, and link it to the `users-service` container...

---

Add [Flask-SQLAlchemy](http://flask-sqlalchemy.pocoo.org/) and psycopg2 to the *requirements.txt* file:

```
Flask-SQLAlchemy==2.3.2
psycopg2==2.7.3.1
```

Update *config.py*:

```python
# users-service/project/config.py


import os


class BaseConfig:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(BaseConfig):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')


class TestingConfig(BaseConfig):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_TEST_URL')


class ProductionConfig(BaseConfig):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
```

Update *\_\_init\_\_.py*, to create a new instance of SQLAlchemy and define the database model:

```python
# users-service/project/__init__.py


import os
import datetime
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy


# instantiate the app
app = Flask(__name__)

# set config
app_settings = os.getenv('APP_SETTINGS')
app.config.from_object(app_settings)

# instantiate the db
db = SQLAlchemy(app)

# model
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False)
    active = db.Column(db.Boolean(), default=True, nullable=False)

    def __init__(self, username, email):
        self.username = username
        self.email = email


# routes
@app.route('/users/ping', methods=['GET'])
def ping_pong():
    return jsonify({
        'status': 'success',
        'message': 'pong!'
    })
```

Add a "db" directory to "project", and add a *create.sql* file in that new directory:

```sql
CREATE DATABASE users_prod;
CREATE DATABASE users_dev;
CREATE DATABASE users_test;
```

Next, add a *Dockerfile* to the same directory:

```
FROM postgres

# run create.sql on init
ADD create.sql /docker-entrypoint-initdb.d
```

Here, we extend the official Postgres image by adding a SQL file to the "docker-entrypoint-initdb.d" directory in the container, which will execute on init.

Update *docker-compose.yml-dev*:

```
version: '3.3'

services:

  users-service:
    container_name: users-service
    build:
      context: ./users-service
      dockerfile: Dockerfile-dev
    volumes:
      - './users-service:/usr/src/app'
    ports:
      - 5001:5000
    environment:
      - APP_SETTINGS=project.config.DevelopmentConfig
      - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_dev
      - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
    depends_on:
      - users-db
    links:
      - users-db

  users-db:
    container_name: users-db
    build:
      context: ./users-service/project/db
      dockerfile: Dockerfile
    ports:
      - 5435:5432
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
```

Once spun up, Postgres will be available on port `5435` on the host machine and on port `5432` for services running in other containers. Since the `users-service` is dependent not only on the container being up and running but also the actual Postgres instance also being up and healthy, let's add an *entrypoint.sh* file to "users-service":

```sh
#!/bin/sh

echo "Waiting for postgres..."

while ! nc -z users-db 5432; do
  sleep 0.1
done

echo "PostgreSQL started"

python manage.py runserver -h 0.0.0.0
```

Update *Dockerfile-dev*:

```sh
FROM python:3.6.3

# install environment dependencies
RUN apt-get update -yqq \
  && apt-get install -yqq --no-install-recommends \
    netcat \
  && apt-get -q clean

# set working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# add requirements
ADD ./requirements.txt /usr/src/app/requirements.txt

# install requirements
RUN pip install -r requirements.txt

# add entrypoint.sh
ADD ./entrypoint.sh /usr/src/app/entrypoint.sh

# add app
ADD . /usr/src/app

# run server
CMD ["./entrypoint.sh"]
```

Sanity check:

```sh
$ docker-compose -f docker-compose-dev.yml up -d --build
```

Ensure [http://DOCKER_MACHINE_IP:5001/users/ping](http://DOCKER_MACHINE_IP:5001/users/ping) still works:

```json
{
  "message": "pong!",
  "status": "success"
}
```

Update *manage.py*:

```python
# users-service/manage.py


from flask_script import Manager

from project import app, db


manager = Manager(app)


@manager.command
def recreate_db():
    """Recreates a database."""
    db.drop_all()
    db.create_all()
    db.session.commit()


if __name__ == '__main__':
    manager.run()
```

This registers a new command, `recreate_db`,  to the manager so that we can run it from the command line. Apply the model to the dev database:

```
$ docker-compose -f docker-compose-dev.yml run users-service python manage.py recreate_db
```

Did this work? Let's hop into psql...

```sh
$ docker exec -ti $(docker ps -aqf "name=users-db") psql -U postgres

# \c users_dev
You are now connected to database "users_dev" as user "postgres".

# \dt
         List of relations
 Schema | Name  | Type  |  Owner
--------+-------+-------+----------
 public | users | table | postgres
(1 row)

# \q
```
