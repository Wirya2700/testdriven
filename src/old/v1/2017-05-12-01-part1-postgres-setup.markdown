---
title: Postgres Setup
layout: post
date: 2017-05-12 23:59:57
permalink: part-one-postgres-setup
intro: false
part: 1
lesson: 4
share: true
---

In this lesson, we'll configure Postgres, get it up and running in another container, and link it to the `users-service` container...

---

Add [Flask-SQLAlchemy](http://flask-sqlalchemy.pocoo.org/) and psycopg2 to the *requirements.txt* file:

```
Flask-SQLAlchemy==2.2
psycopg2==2.7.1
```

Update *config.py*:

```python
# project/config.py


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
# project/__init__.py


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
    active = db.Column(db.Boolean(), default=False, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, username, email):
        self.username = username
        self.email = email
        self.created_at = datetime.datetime.utcnow()


# routes

@app.route('/ping', methods=['GET'])
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

Update *docker-compose.yml*:

```
version: '2.1'

services:

  users-db:
    container_name: users-db
    build: ./project/db
    ports:
        - 5435:5432  # expose ports - HOST:CONTAINER
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: exit 0

  users-service:
    container_name: users-service
    build: ./
    volumes:
      - '.:/usr/src/app'
    ports:
      - 5001:5000 # expose ports - HOST:CONTAINER
    environment:
      - APP_SETTINGS=project.config.DevelopmentConfig
      - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_dev
      - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
    depends_on:
      users-db:
        condition: service_healthy
    links:
      - users-db
```

Once spun up, environment variables are added and an exit code of `0` is sent after the container is successfully up and running. Postgres will then be available on port `5435` on the host machine and on port `5432` for services running in other containers.

Sanity check:

```sh
$ docker-compose up -d --build
```

Update *manage.py*:

```python
# manage.py


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

This registers a new command, `recreate_db`, to the manager so that we can run it from the command line. Apply the model to the dev database:

```
$ docker-compose run users-service python manage.py recreate_db
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
