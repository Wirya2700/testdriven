---
title: Flask Migrate
layout: post
date: 2017-06-12 23:59:57
permalink: part-three-flask-migrate
intro: false
part: 3
lesson: 2
share: true
---

In this lesson, we'll utilize Flask Migrate to handle database migrations...

---

Navigate to *flask-microservices-users*, activate the virtual environment, add the environment variables, and then run the tests to ensure they pass:

```sh
$ source env/bin/activate
(env)$ export APP_SETTINGS=project.config.DevelopmentConfig
(env)$ export DATABASE_URL=postgres://postgres:postgres@localhost:5432/users_dev
(env)$ export DATABASE_TEST_URL=postgres://postgres:postgres@localhost:5432/users_test
(env)$ python manage.py test
```

> You may need to change the username and password depending on your local Postgres config.

Let's make a few changes to the schema in *flask-microservices-users/project/api/models.py*:

1. `username` must be unique
1. `email` must be unique
1. `active` should default to `True`

We'll also add a password field, which will be hashed before it's added to the database:

```python
password = db.Column(db.String(255), nullable=False)
```

With that, let's start with some tests. Add a new file to "flask-microservices-users/project/tests" called *test_user_model.py*. This file will hold tests related to our database model:

```python
# project/tests/test_user_model.py


from project import db
from project.api.models import User
from project.tests.base import BaseTestCase


class TestUserModel(BaseTestCase):

    def test_add_user(self):
        user = User(
            username='justatest',
            email='test@test.com',
        )
        db.session.add(user)
        db.session.commit()
        self.assertTrue(user.id)
        self.assertEqual(user.username, 'justatest')
        self.assertEqual(user.email, 'test@test.com')
        self.assertTrue(user.active)
        self.assertTrue(user.created_at)
```

Run the tests. You should see a single failure - `AssertionError: False is not true` - since `user.active` is `False`.

#### <span style="font-family:'Montserrat', 'sans-serif';">Flask Migrate</span>

Since we need to make a schema change, add [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/):

```sh
(env)$ pip install flask-migrate==2.0.4
(env)$ pip freeze > requirements.txt
```

In *flask-microservices-users/project/\_\_init\_\_.py* add the import, create a new instance, and update `create_app()`:

```python
# project/__init__.py


import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


# instantiate the db
db = SQLAlchemy()
# instantiate flask migrate
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
    from project.api.views import users_blueprint
    app.register_blueprint(users_blueprint)

    return app
```

Then, add a new manager command to *flask-microservices-users/manage.py*, just below `manager = Manager(app)`:

```python
manager.add_command('db', MigrateCommand)
```

Add the import as well:

```python
from flask_migrate import MigrateCommand
```

Generate the migrations folder, add the initial migration, and then apply it to the database:

```sh
(env)$ python manage.py db init
(env)$ python manage.py db migrate
(env)$ python manage.py db upgrade
```

> Review the [documentation](https://flask-migrate.readthedocs.io/en/latest/) for more info.

Now, we can make the changes to the schema:

```python
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, username, email, created_at=datetime.datetime.utcnow()):
        self.username = username
        self.email = email
        self.created_at = created_at
```

Again, run:

```sh
(env)$ python manage.py db migrate
(env)$ python manage.py db upgrade
```

> Keep in mind that if you have any duplicate usernames and/or emails already in your database, you will get an error when trying to apply the migration to the database. You can either update the data or drop the db and start over.

Run the tests again. They should pass! Before moving on, let's add a few more tests to *flask-microservices-users/project/tests/test_user_model.py*:

```python
def test_add_user_duplicate_username(self):
    user = User(
        username='justatest',
        email='test@test.com',
    )
    db.session.add(user)
    db.session.commit()
    duplicate_user = User(
        username='justatest',
        email='test@test2.com',
    )
    db.session.add(duplicate_user)
    self.assertRaises(IntegrityError, db.session.commit)

def test_add_user_duplicate_email(self):
    user = User(
        username='justatest',
        email='test@test.com',
    )
    db.session.add(user)
    db.session.commit()
    duplicate_user = User(
        username='justanothertest',
        email='test@test.com',
    )
    db.session.add(duplicate_user)
    self.assertRaises(IntegrityError, db.session.commit)
```

Notice how we didn't invoke `db.session.commit` the second time, when adding a user. Instead, we passed it to `assertRaises()` and let it invoke it and assert the exception was raised.

Add the import:

```python
from sqlalchemy.exc import IntegrityError
```

Test again.

#### <span style="font-family:'Montserrat', 'sans-serif';">Refactor</span>

Now is a good time to do some refactoring...

First, in *flask-microservices-users/project/tests/test_users.py*, rename `test_add_user_duplicate_user` to `test_add_user_duplicate_email`.

Also, did you notice that we added a new user a number of times in the *test_user_model.py* tests? Let's abstract out the `add_user` helper function from *test_users.py* to a utility file so we can use it in both test files.

Add a new file called *utils.py* to "tests":

```python
# project/tests/utils.py


import datetime


from project import db
from project.api.models import User


def add_user(username, email, created_at=datetime.datetime.utcnow()):
    user = User(username=username, email=email, created_at=created_at)
    db.session.add(user)
    db.session.commit()
    return user
```

Then remove the helper from *test_users.py* and add the import to the same file:

```python
from project.tests.utils import add_user
```

Refactor *test_user_model.py* like so:

```python
# project/tests/test_user_model.py


from sqlalchemy.exc import IntegrityError

from project import db
from project.api.models import User
from project.tests.base import BaseTestCase
from project.tests.utils import add_user

class TestUserModel(BaseTestCase):

    def test_add_user(self):
        user = add_user('justatest', 'test@test.com')
        self.assertTrue(user.id)
        self.assertEqual(user.username, 'justatest')
        self.assertEqual(user.email, 'test@test.com')
        self.assertTrue(user.active)
        self.assertTrue(user.created_at)

    def test_add_user_duplicate_username(self):
        add_user('justatest', 'test@test.com')
        duplicate_user = User(
            username='justatest',
            email='test@test2.com',
        )
        db.session.add(duplicate_user)
        self.assertRaises(IntegrityError, db.session.commit)

    def test_add_user_duplicate_email(self):
        add_user('justatest', 'test@test.com')
        duplicate_user = User(
            username='justatest2',
            email='test@test.com',
        )
        db.session.add(duplicate_user)
        self.assertRaises(IntegrityError, db.session.commit)
```

Run the tests again to ensure nothing broke.
