---
title: Scores API Database
layout: post
date: 2017-09-24 23:59:59
permalink: part-six-scores-api-database
intro: false
part: 6
lesson: 3
share: true
---

In this lesson, we'll test-drive the development of the scores API starting with the database...

---

Set `dev` as the active machine:

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

Run the tests:

```sh
$ sh test.sh
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Database Setup</span>

Steps:

1. Write a test
1. Configure the extensions
1. Update Docker
1. Add the model
1. Update *manage.py*
1. Update *.travis.yml*

> This is a great time to check your understanding. Set up the database along with a `Score` model (with `id`, `user_id`, `exercise_id`, `correct`, `created_at`, `updated_at` fields) on your own. Make sure to write some tests!

##### Write a test

Create a new folder called "scores" in "project/tests", and then add a new file to "scores" called *test_scores_model.py*:

```python
# project/tests/scores/test_scores_model.py


from project import db
from project.api.scores.models import Score
from project.tests.base import BaseTestCase
from project.tests.utils import add_score


class TestScoreModel(BaseTestCase):

    def test_add_score(self):
        score = add_score(1, 1, True)
        self.assertTrue(score.id)
        self.assertEqual(score.user_id, 1)
        self.assertEqual(score.exercise_id, 1)
        self.assertTrue(score.created_at)
        self.assertTrue(score.updated_at)
```

Make sure to add an *\_\_init\_\_.py* file to "scores" as well. Then, create the *utils.py* file as well in "project/tests":

```python
# project/tests/utils.py


import datetime


from project import db
from project.api.scores.models import Score


def add_score(user_id, exercise_id, correct,
              created_at=datetime.datetime.utcnow()):
    score = Score(
        user_id=user_id,
        exercise_id=exercise_id,
        correct=correct,
        created_at=created_at,
        updated_at=created_at
    )
    db.session.add(score)
    db.session.commit()
    return score
```

Ensure the tests fail before moving on.

##### Configure the extensions

Add Flask-SQLAlchemy, Flask-Migrate and psycopg2 to the requirements.txt file:

```
Flask-SQLAlchemy==2.2
Flask-Migrate==2.0.4
psycopg2==2.7.1
```

Update *project/config.py*:

```python
# project/config.py


import os


class BaseConfig:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    USERS_SERVICE_URL = os.environ.get('USERS_SERVICE_URL')
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


class StagingConfig(BaseConfig):
    """Staging configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')


class ProductionConfig(BaseConfig):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
```

Next, update *project/\_\_init\_\_.py*, to create a new instance of SQLAlchemy and Flask-Migrate:

```python
# project/__init__.py


import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


# instantiate the extensions
db = SQLAlchemy()
migrate = Migrate()


def create_app():

    # instantiate the app
    app = Flask(__name__)

    # enable CORS
    CORS(app)

    # set config
    app_settings = os.getenv('APP_SETTINGS')
    app.config.from_object(app_settings)

    # set up extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # register blueprints
    from project.api.eval import eval_blueprint
    app.register_blueprint(eval_blueprint)

    return app
```

Next, update *project/tests/base.py* to create the database in the `setUp()` and then drop it in the `tearDown()`:

```python
# project/tests/base.py


from flask_testing import TestCase

from project import create_app, db

app = create_app()


class BaseTestCase(TestCase):
    def create_app(self):
        app.config.from_object('project.config.TestingConfig')
        return app

    def setUp(self):
        db.create_all()
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
```

Finally, update *project/tests/test_config.py*:

```python
# project/tests/test_config.py


import os
import unittest

from flask import current_app
from flask_testing import TestCase

from project import create_app

app = create_app()


class TestDevelopmentConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.DevelopmentConfig')
        return app

    def test_app_is_development(self):
        self.assertTrue(app.config['DEBUG'] is True)
        self.assertFalse(current_app is None)

class TestTestingConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.TestingConfig')
        return app

    def test_app_is_testing(self):
        self.assertTrue(app.config['DEBUG'])
        self.assertTrue(app.config['TESTING'])
        self.assertFalse(app.config['PRESERVE_CONTEXT_ON_EXCEPTION'])

class TestProductionConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.ProductionConfig')
        return app

    def test_app_is_production(self):
        self.assertFalse(app.config['DEBUG'])
        self.assertFalse(app.config['TESTING'])


if __name__ == '__main__':
    unittest.main()
```

##### Update Docker

Add a "db" directory to "project", and then add a *create.sql* file in "db":

```sql
CREATE DATABASE eval_prod;
CREATE DATABASE eval_staging;
CREATE DATABASE eval_dev;
CREATE DATABASE eval_test;
```

Add a *Dockerfile* to the "db" directory as well:

```
FROM postgres

# run create.sql on init
ADD create.sql /docker-entrypoint-initdb.d
```

Then, within *flask-microservices-main*, add the service to *docker-compose.yml*:

```yaml
eval-db:
  container_name: eval-db
  build:
    context: ../flask-microservices-eval/project/db
  ports:
      - 5436:5432  # expose ports - HOST:CONTAINER
  environment:
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres
  healthcheck:
    test: exit 0
```

Update the `eval-service` to link the `eval-db` to it and set the `DATABASE_URL` and `DATABASE_TEST_URL` environment variables:

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
    - DATABASE_URL=postgres://postgres:postgres@eval-db:5432/eval_dev
    - DATABASE_TEST_URL=postgres://postgres:postgres@eval-db:5432/eval_test
  depends_on:
    users-service:
      condition: service_started
    eval-db:
      condition: service_healthy
  links:
    - users-service
    - eval-db
```

##### Add the model

Within "project/api", add a new directory called "scores", and then add a new file called *models.py* to "scores":

```python
# project/api/scores/models.py


import datetime

from project import db


class Score(db.Model):
    __tablename__ = "scores"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    exercise_id = db.Column(db.Integer, nullable=False)
    correct = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    def __init__(
            self, user_id, exercise_id, correct,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()):
        self.user_id = user_id
        self.exercise_id = exercise_id
        self.correct = correct
        self.created_at = created_at
        self.updated_at = updated_at
```

Add an *\_\_init\_\_.py* file to "scores", and then run the tests. They should pass.

##### Update *manage.py*:

Finally, update *manage.py*:

```python
# manage.py


import unittest
import coverage

from flask_script import Manager
from flask_migrate import MigrateCommand

from project import create_app, db
from project.api.scores.models import Score


COV = coverage.coverage(
    branch=True,
    include='project/*',
    omit=[
        'project/tests/*'
    ]
)
COV.start()


app = create_app()
manager = Manager(app)
manager.add_command('db', MigrateCommand)


@manager.command
def test():
    """Runs the unit tests without test coverage."""
    tests = unittest.TestLoader().discover('project/tests', pattern='test*.py')
    result = unittest.TextTestRunner(verbosity=2).run(tests)
    if result.wasSuccessful():
        return 0
    return 1


@manager.command
def cov():
    """Runs the unit tests with coverage."""
    tests = unittest.TestLoader().discover('project/tests')
    result = unittest.TextTestRunner(verbosity=2).run(tests)
    if result.wasSuccessful():
        COV.stop()
        COV.save()
        print('Coverage Summary:')
        COV.report()
        COV.html_report()
        COV.erase()
        return 0
    return 1


@manager.command
def recreate_db():
    """Recreates a database."""
    db.drop_all()
    db.create_all()
    db.session.commit()


if __name__ == '__main__':
    manager.run()
```

Apply the model to the dev database:

```sh
$ docker-compose run eval-service python manage.py recreate_db
```

Did it work?

```sh
$ docker exec -ti $(docker ps -aqf "name=eval-db") psql -U postgres

# \c eval_dev
You are now connected to database "eval_dev" as user "postgres".

# \dt
         List of relations
 Schema |  Name  | Type  |  Owner
--------+--------+-------+----------
 public | scores | table | postgres
(1 row)

# \q
```

##### Update *.travis.yml*:

```yaml
language: python

python:
  - '3.6'

service:
  - postgresql

install:
  - pip install -r requirements.txt

before_script:
  - export APP_SETTINGS=project.config.TestingConfig
  - export DATABASE_TEST_URL=postgresql://postgres:@localhost/eval_test
  - psql -c 'create database eval_test;' -U postgres
  - python manage.py recreate_db

script:
  - python manage.py test
```

Commit. Push your code to GitHub. Ensure the Travis build passes.
