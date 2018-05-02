---
title: Code Coverage
layout: post
date: 2017-06-04 23:59:57
permalink: part-two-code-coverage
intro: false
part: 2
lesson: 3
share: true
---

In this lesson, we'll add code coverage via [Coverage.py](http://coverage.readthedocs.io/en/coverage-4.4.1/) to the *flask-microservices-users* project...

---

Navigate to the *flask-microservices-users* project directory, create and activate a virtual environment, and then install Coverage.py:

```sh
$ python3.6 -m venv env
$ source env/bin/activate
(env)$ pip install coverage==4.4.1
(env)$ pip freeze > requirements.txt
```

From there, we need to configure the coverage reports in *manage.py*. Start by adding the configuration right after the imports:

```python
COV = coverage.coverage(
    branch=True,
    include='project/*',
    omit=[
        'project/tests/*'
    ]
)
COV.start()
```

Then add the new manager command:

```python
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
```

Don't forget the import!

```python
import coverage
```

The file should now look like:

```python
# manage.py


import unittest
import coverage

from flask_script import Manager

from project import create_app, db
from project.api.models import User


COV = coverage.coverage(
    branch=True,
    include='project/*',
    omit=[
        'project/tests/*',
        'project/server/config.py',
        'project/server/*/__init__.py'
    ]
)
COV.start()


app = create_app()
manager = Manager(app)


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


@manager.command
def seed_db():
    """Seeds the database."""
    db.session.add(User(username='michael', email="michael@realpython.com"))
    db.session.add(User(username='michaelherman', email="michael@mherman.org"))
    db.session.commit()


if __name__ == '__main__':
    manager.run()
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check</span>

Finally, let's make sure we can run and test this project in isolation, without Docker Compose.

First, set up Postgres and create the databases - `users_dev` and `users_test`, and then add the environment variables:

```sh
(env)$ export APP_SETTINGS=project.config.DevelopmentConfig
(env)$ export DATABASE_URL=postgres://postgres:postgres@localhost:5432/users_dev
(env)$ export DATABASE_TEST_URL=postgres://postgres:postgres@localhost:5432/users_test
```

> You may need to change the username and password depending on your local Postgres config.

Create and seed the local database and run the tests (without coverage):

```sh
(env)$ python manage.py recreate_db
(env)$ python manage.py seed_db
(env)$ python manage.py test
```

You should see two failures:

```sh
======================================================================
FAIL: test_app_is_development (test_config.TestDevelopmentConfig)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "flask-microservices-users/project/tests/test_config.py", line 25, in test_app_is_development
    'postgres://postgres:postgres@users-db:5432/users_dev'
AssertionError: False is not true

======================================================================
FAIL: test_app_is_testing (test_config.TestTestingConfig)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "flask-microservices-users/project/tests/test_config.py", line 41, in test_app_is_testing
    'postgres://postgres:postgres@users-db:5432/users_test'
AssertionError: False is not true

----------------------------------------------------------------------
Ran 15 tests in 0.330s
```

Open *test_config.py*. Right now we're hard-coding the database URI. Let's pull the URI from the environment variable instead, so the config will [scale a bit cleaner](https://12factor.net/config) across environments.

`test_app_is_development()`:

```python
def test_app_is_development(self):
    self.assertTrue(app.config['SECRET_KEY'] == 'my_precious')
    self.assertTrue(app.config['DEBUG'] is True)
    self.assertFalse(current_app is None)
    self.assertTrue(
        app.config['SQLALCHEMY_DATABASE_URI'] ==
        os.environ.get('DATABASE_URL')
    )
```

`test_app_is_testing()`:

```python
def test_app_is_testing(self):
    self.assertTrue(app.config['SECRET_KEY'] == 'my_precious')
    self.assertTrue(app.config['DEBUG'])
    self.assertTrue(app.config['TESTING'])
    self.assertFalse(app.config['PRESERVE_CONTEXT_ON_EXCEPTION'])
    self.assertTrue(
        app.config['SQLALCHEMY_DATABASE_URI'] ==
        os.environ.get('DATABASE_TEST_URL')
    )
```

Add the import:

```python
import os
```

The tests should now pass. Try running them with coverage:

```sh
(env)$ python manage.py cov
```

You should see something like:

```sh
Coverage Summary:
Name                    Stmts   Miss Branch BrPart  Cover
---------------------------------------------------------
project/__init__.py        12      5      0      0    58%
project/api/models.py      13     10      0      0    23%
project/api/views.py       53      0     10      0   100%
project/config.py          16      0      0      0   100%
---------------------------------------------------------
TOTAL                      94     15     10      0    86%
```

The web version can be viewed within the newly created "htmlcov" directory. Now you can quickly see which parts of the code are, and are not, covered by a test.
Add this directory to the *.gitignore* file, commit your code, and push it to GitHub.

Let's now run a quick sanity check using Docker Compose.

Deactivate the virtual environment in *flask-microservices-users*, navigate to the *flask-microservices-main* project directory, make sure the active machine is `dev` (via `docker-machine ls`), and then update the containers:

```sh
$ docker-compose up -d --build
```

Run the tests with coverage:

```sh
$ docker-compose run users-service python manage.py cov
```

Finally, switch over to the `aws` machine, update the containers, and then test with coverage:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
$ docker-compose -f docker-compose-prod.yml up -d --build
$ docker-compose -f docker-compose-prod.yml run users-service python manage.py cov
```
