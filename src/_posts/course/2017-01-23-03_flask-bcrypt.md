---
title: Flask Bcrypt
layout: post
permalink: part-three-flask-bcrypt
intro: false
part: 3
lesson: 3
share: true
---

In this lesson, we'll add support for password hashing...

---

### Flask Bcrypt Setup

To manage password hashing, we'll use the [Flask-Bcrypt](https://flask-bcrypt.readthedocs.io/en/latest/) extension. Add it to the *requirements.txt* file like so:

```
flask-bcrypt==0.7.1
```

Next, wire it up to the app in *services/users/project/\_\_init\_\_.py*:

```python
# users/project/__init__.py


import os

from flask_cors import CORS
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt


# instantiate the extensions
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()


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
    migrate.init_app(app, db)

    # register blueprints
    from project.api.users import users_blueprint
    app.register_blueprint(users_blueprint)

    return app
```

Before we update the model, add the following test to *test_user_model.py*:

```python
def test_passwords_are_random(self):
    user_one = add_user('justatest', 'test@test.com', 'test')
    user_two = add_user('justatest2', 'test@test2.com', 'test')
    self.assertNotEqual(user_one.password, user_two.password)
```

Update the helper to take a password:

```python
def add_user(username, email, password):
    user = User(username=username, email=email, password=password)
    db.session.add(user)
    db.session.commit()
    return user
```

Make sure to pass in an argument for all instances of `add_user()` and `User()` as well as in the payload for POST requests to `/users` and `/` in both *test_user_model.py* and *test_users.py*. Do this now.

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d --build
```

Run the tests:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py test
```

You should see a number of failures:

```sh
TypeError: __init__() got an unexpected keyword argument 'password'
```

To get them green, first add the password field to the model in *services/users/project/api/models.py*:

```python
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = bcrypt.generate_password_hash(password).decode()
```

Then, add the `bcrypt` import:

```python
from project import db, bcrypt
```

Run the tests again. More failures, right?

```sh
TypeError: __init__() missing 1 required positional argument: 'password'
```

Apply the migrations:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py db migrate

$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py db upgrade
```

Update `add_user()` in *services/users/project/api/users.py*:

```python
@users_blueprint.route('/users', methods=['POST'])
def add_user():
    post_data = request.get_json()
    response_object = {
        'status': 'fail',
        'message': 'Invalid payload.'
    }
    if not post_data:
        return jsonify(response_object), 400
    username = post_data.get('username')
    email = post_data.get('email')
    password = post_data.get('password')
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            db.session.add(User(
                username=username, email=email, password=password))
            db.session.commit()
            response_object['status'] = 'success'
            response_object['message'] = f'{email} was added!'
            return jsonify(response_object), 201
        else:
            response_object['message'] = 'Sorry. That email already exists.'
            return jsonify(response_object), 400
    except exc.IntegrityError as e:
        db.session.rollback()
        return jsonify(response_object), 400
```

Also, update `index()`:

```python
@users_blueprint.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        db.session.add(User(username=username, email=email, password=password))
        db.session.commit()
    users = User.query.all()
    return render_template('index.html', users=users)
```

The tests should pass. Turning to the API, what if we don't pass a password into the payload? Write a test!

*test_users.py*:

```python
def test_add_user_invalid_json_keys_no_password(self):
    """
    Ensure error is thrown if the JSON object
    does not have a password key.
    """
    with self.client:
        response = self.client.post(
            '/users',
            data=json.dumps(dict(
                username='michael',
                email='michael@realpython.com')),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])
```

You should see the following error when the tests are ran:

```sh
raise ValueError('Password must be non-empty.')
ValueError: Password must be non-empty.
```

To fix, add a another exception handler to the try/except block in the `add_user` view handler:

```python
except (exc.IntegrityError, ValueError) as e:
    db.session.rollback()
    return jsonify(response_object), 400
```

Test again. Then, update the following test in *test_user_model.py*, asserting the user object has a password field:

```python
def test_add_user(self):
    user = add_user('justatest', 'test@test.com', 'test')
    self.assertTrue(user.id)
    self.assertEqual(user.username, 'justatest')
    self.assertEqual(user.email, 'test@test.com')
    self.assertTrue(user.active)
    self.assertTrue(user.password)
```

### Log Rounds

Finally, did you notice that the tests are running *much* slower than before? This is due to the `BCRYPT_LOG_ROUNDS` setting for Flask Bcrypt. Since we have not defined a value yet in the app config, Flask Bcrypt uses the [default value of 12](https://github.com/maxcountryman/flask-bcrypt/blob/master/flask_bcrypt.py#L153), which is unnecessarily high for a test environment.

Update the test specs in *services/users/project/tests/test_config.py*:

```python
class TestDevelopmentConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.DevelopmentConfig')
        return app

    def test_app_is_development(self):
        self.assertTrue(app.config['SECRET_KEY'] == 'my_precious')
        self.assertTrue(app.config['DEBUG'])
        self.assertFalse(current_app is None)
        self.assertTrue(
            app.config['SQLALCHEMY_DATABASE_URI'] ==
            os.environ.get('DATABASE_URL')
        )
        self.assertTrue(app.config['BCRYPT_LOG_ROUNDS'] == 4)


class TestTestingConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.TestingConfig')
        return app

    def test_app_is_testing(self):
        self.assertTrue(app.config['SECRET_KEY'] == 'my_precious')
        self.assertTrue(app.config['DEBUG'])
        self.assertTrue(app.config['TESTING'])
        self.assertFalse(app.config['PRESERVE_CONTEXT_ON_EXCEPTION'])
        self.assertTrue(
            app.config['SQLALCHEMY_DATABASE_URI'] ==
            os.environ.get('DATABASE_TEST_URL')
        )
        self.assertTrue(app.config['BCRYPT_LOG_ROUNDS'] == 4)


class TestProductionConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.ProductionConfig')
        return app

    def test_app_is_production(self):
        self.assertTrue(app.config['SECRET_KEY'] == 'my_precious')
        self.assertFalse(app.config['DEBUG'])
        self.assertFalse(app.config['TESTING'])
        self.assertTrue(app.config['BCRYPT_LOG_ROUNDS'] == 13)
```

Make sure the tests fail, then update *services/users/project/config.py*:

```python
# users/project/config.py


import os


class BaseConfig:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'my_precious'
    BCRYPT_LOG_ROUNDS = 13


class DevelopmentConfig(BaseConfig):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    BCRYPT_LOG_ROUNDS = 4


class TestingConfig(BaseConfig):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_TEST_URL')
    BCRYPT_LOG_ROUNDS = 4


class ProductionConfig(BaseConfig):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
```

Then, update `__init__` from the `User` model:

```python
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = bcrypt.generate_password_hash(
            password, current_app.config.get('BCRYPT_LOG_ROUNDS')
        ).decode()
```

Don't forget the import:

```python
from flask import current_app
```

Run the tests again!

1. Do they pass?
1. Are they faster? (0.371s vs 4.322s on my end)

> Need help deciding how many rounds to use in production? Check out [this](https://security.stackexchange.com/questions/17207/recommended-of-rounds-for-bcrypt) Stack Exchange article.

Commit, then push your code to GitHub. Make sure the Travis build passes. With that, let's get JWT up and running...
