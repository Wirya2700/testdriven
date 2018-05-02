---
title: Flask Migrate
layout: post
permalink: part-three-flask-migrate
intro: false
part: 3
lesson: 2
share: true
---

In this lesson, we'll utilize Flask Migrate to handle database migrations...

---

Set `testdriven-dev` as the active Docker Machine:

```sh
$ docker-machine env testdriven-dev
$ eval $(docker-machine env testdriven-dev)
```

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d
```

Ensure the app is working in the browser, and then run the tests:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py test

$ docker-compose -f docker-compose-dev.yml \
    run client npm test
```

### Model

Let's make a few changes to the schema in *services/users/project/api/models.py*:

1. `username` must be unique
1. `email` must be unique

We'll also add a password field (in an upcoming lesson), which will be hashed before it's added to the database:

```python
password = db.Column(db.String(255), nullable=False)
```

Don't make any changes just yet. Let's start with some tests. Add a new file to "services/users/project/tests" called *test_user_model.py*. This file will hold tests related to our database model:

```python
# users/project/tests/test_user_model.py


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

    def test_to_json(self):
        user = add_user('justatest', 'test@test.com')
        self.assertTrue(isinstance(user.to_json(), dict))
```

Notice how we didn't invoke `db.session.commit` the second time, when adding a user. Instead, we passed it to `assertRaises()` and let it invoke it and assert the exception was raised.

Add the import:

```python
from sqlalchemy.exc import IntegrityError
```

Run the tests. You should see two failures:

```sh
test_add_user_duplicate_email (test_user_model.TestUserModel) ... FAIL
test_add_user_duplicate_username (test_user_model.TestUserModel) ... FAIL
```

Error:

```sh
AssertionError: IntegrityError not raised by do
```

### Flask Migrate Setup

Since we need to make a schema change, add [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) to the *requirements.txt* file:

```
flask-migrate==2.1.1
```

In *services/users/project/\_\_init\_\_.py*, add the import, create a new instance, and update `create_app()`:

```python
# users/project/__init__.py


import os

from flask_cors import CORS
from flask import Flask
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
    from project.api.users import users_blueprint
    app.register_blueprint(users_blueprint)

    return app
```

Then, add a new manager command to *services/users/manage.py*, just below `manager = Manager(app)`:

```python
manager.add_command('db', MigrateCommand)
```

Add the import as well:

```python
from flask_migrate import MigrateCommand
```

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d --build
```

Generate the migrations folder, add the initial migration, and then apply it to the database:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py db init

$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py db migrate

$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py db upgrade
```

> Review the [Flask-Migrate documentation](https://flask-migrate.readthedocs.io/en/latest/) for more info on the above commands.

Now, we can make the changes to the schema:

```python
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
```

Again, run:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py db migrate

$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py db upgrade
```

> Keep in mind that if you have any duplicate usernames and/or emails already in your database, you will get an error when trying to apply the migration to the database. You can either update the data or drop the db and start over.

Run the tests again. They should pass!

### Refactor

Now is a good time to do some refactoring...

First, in *services/users/project/tests/test_users.pyy*, rename `test_add_user_duplicate_user` to `test_add_user_duplicate_email`.

Also, did you notice that we added a new user a number of times in the *test_user_model.py* tests? Let's abstract out the `add_user` helper function from *test_users.py* to a utility file so we can use it in both test files.

Add a new file called *utils.py* to "tests":

```python
# users/project/tests/utils.py


from project import db
from project.api.models import User


def add_user(username, email):
    user = User(username=username, email=email)
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
# users/project/tests/test_user_model.py


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

    def test_to_json(self):
        user = add_user('justatest', 'test@test.com')
        self.assertTrue(isinstance(user.to_json(), dict))
```

Run the tests again to ensure nothing broke from the refactor. What about flake8?

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service flake8 project
```

Correct any issues, and then commit and push your code to GitHub. Make sure the Travis build passes.
