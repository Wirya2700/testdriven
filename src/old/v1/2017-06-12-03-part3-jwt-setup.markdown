---
title: JWT Setup
layout: post
date: 2017-06-12 23:59:59
permalink: part-three-jwt-setup
intro: false
part: 3
lesson: 4
share: true
---

In this lesson, we'll add JWT to the users service...

---

If you're new to JWTs and/or token-based authentication, review the [Introduction](https://realpython.com/blog/python/token-based-authentication-with-flask/#introduction) of the [Token-Based Authentication With Flask](https://realpython.com/blog/python/token-based-authentication-with-flask) post. [How We Solved Authentication and Authorization in Our Microservice Architecture](https://medium.com/technology-learning/how-we-solved-authentication-and-authorization-in-our-microservice-architecture-994539d1b6e6) is an excellent read as well.

The auth workflow works as follows:

1. The end user submits login credentials from *flask-microservices-client*, which is sent to *flask-microservices-users* via AJAX
1. The server then verifies that the credentials are valid and responds with an auth token
1. The token is stored on the client and is sent with all subsequent requests, where the server decodes the token and validates it

Tokens have three main parts:

1. Header
1. Payload
1. Signature

> If you're curious, you can read more about each part from [Introduction to JSON Web Tokens](https://jwt.io/introduction/).

To work with JSON Web Tokens in our app, install the [PyJWT](http://pyjwt.readthedocs.io/en/latest/) package:

```sh
(env)$ pip install pyjwt==1.5.0
(env)$ pip freeze > requirements.txt
```

Before writing any code, add the following test to `TestUserModel()` in *flask-microservices-users/project/tests/test_user_model.py*:

```python
def test_encode_auth_token(self):
    user = add_user('justatest', 'test@test.com', 'test')
    auth_token = user.encode_auth_token(user.id)
    self.assertTrue(isinstance(auth_token, bytes))
```

As always, make sure the tests fail. Next, add the `encode_auth_token` method to the `User()` class in *models.py*:

```python
def encode_auth_token(self, user_id):
    """Generates the auth token"""
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(
                days=0, seconds=5),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(
            payload,
            current_app.config.get('SECRET_KEY'),
            algorithm='HS256'
        )
    except Exception as e:
        return e
```

Given a user id, `encode_auth_token` encodes and returns a token. Take note of the payload. This is where we add metadata about the token and information about the user. This info is often referred to as [JWT Claims](https://scotch.io/tutorials/the-anatomy-of-a-json-web-token#payload). We utilized the following "claims":

1. `exp`: token expiration date
1. `iat` (issued at): token generation date
1. `sub`: the subject of the token e.g., - the user whom it identifies

Add the import:

```python
import jwt
```

Run the tests. They should pass, right?

Turn to the app config. The secret key needs to be updated for production. Let's configure it with an environment variable.

First, within *test_config.py*, change:

```python
self.assertTrue(app.config['SECRET_KEY'] == 'my_precious')
```

To:

```python
self.assertTrue(
    app.config['SECRET_KEY'] ==
    os.environ.get('SECRET_KEY')
)
```

Then update `BaseConfig`:

```python
class BaseConfig:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    BCRYPT_LOG_ROUNDS = 13
```

Add the environment variable - `export SECRET_KEY=my_precious` - and then run the tests.

Let's also add the token expiration to the config:

```python
class BaseConfig:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    BCRYPT_LOG_ROUNDS = 13
    TOKEN_EXPIRATION_DAYS = 30
    TOKEN_EXPIRATION_SECONDS = 0


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
    TOKEN_EXPIRATION_DAYS = 0
    TOKEN_EXPIRATION_SECONDS = 3


class ProductionConfig(BaseConfig):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
```

Update the tests:

```python
class TestDevelopmentConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.DevelopmentConfig')
        return app

    def test_app_is_development(self):
        self.assertTrue(
            app.config['SECRET_KEY'] ==
            os.environ.get('SECRET_KEY')
        )
        self.assertTrue(app.config['DEBUG'] is True)
        self.assertFalse(current_app is None)
        self.assertTrue(
            app.config['SQLALCHEMY_DATABASE_URI'] ==
            os.environ.get('DATABASE_URL')
        )
        self.assertTrue(app.config['BCRYPT_LOG_ROUNDS'] == 4)
        self.assertTrue(app.config['TOKEN_EXPIRATION_DAYS'] == 30)
        self.assertTrue(app.config['TOKEN_EXPIRATION_SECONDS'] == 0)

class TestTestingConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.TestingConfig')
        return app

    def test_app_is_testing(self):
        self.assertTrue(
            app.config['SECRET_KEY'] ==
            os.environ.get('SECRET_KEY')
        )
        self.assertTrue(app.config['DEBUG'])
        self.assertTrue(app.config['TESTING'])
        self.assertFalse(app.config['PRESERVE_CONTEXT_ON_EXCEPTION'])
        self.assertTrue(
            app.config['SQLALCHEMY_DATABASE_URI'] ==
            os.environ.get('DATABASE_TEST_URL')
        )
        self.assertTrue(app.config['BCRYPT_LOG_ROUNDS'] == 4)
        self.assertTrue(app.config['TOKEN_EXPIRATION_DAYS'] == 0)
        self.assertTrue(app.config['TOKEN_EXPIRATION_SECONDS'] == 3)

class TestProductionConfig(TestCase):
    def create_app(self):
        app.config.from_object('project.config.ProductionConfig')
        return app

    def test_app_is_production(self):
        self.assertTrue(
            app.config['SECRET_KEY'] ==
            os.environ.get('SECRET_KEY')
        )
        self.assertFalse(app.config['DEBUG'])
        self.assertFalse(app.config['TESTING'])
        self.assertTrue(app.config['BCRYPT_LOG_ROUNDS'] == 13)
        self.assertTrue(app.config['TOKEN_EXPIRATION_DAYS'] == 30)
        self.assertTrue(app.config['TOKEN_EXPIRATION_SECONDS'] == 0)
```

Then update the `encode_auth_token` in the model:

```python
def encode_auth_token(self, user_id):
    """Generates the auth token"""
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(
                days=current_app.config.get('TOKEN_EXPIRATION_DAYS'),
                seconds=current_app.config.get('TOKEN_EXPIRATION_SECONDS')
            ),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(
            payload,
            current_app.config.get('SECRET_KEY'),
            algorithm='HS256'
        )
    except Exception as e:
        return e
```

> Now is a great time to check your understanding: See if you can write the test as well as the code for decoding a token on your own.

Moving on, add the following test to *test_user_model.py* for decoding a token:

```python
def test_decode_auth_token(self):
    user = add_user('justatest', 'test@test.com', 'test')
    auth_token = user.encode_auth_token(user.id)
    self.assertTrue(isinstance(auth_token, bytes))
    self.assertEqual(User.decode_auth_token(auth_token), user.id)
```

Add the following method to the `User()` class:

```python
@staticmethod
def decode_auth_token(auth_token):
    """Decodes the auth token - :param auth_token: - :return: integer|string"""
    try:
        payload = jwt.decode(auth_token, current_app.config.get('SECRET_KEY'))
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return 'Signature expired. Please log in again.'
    except jwt.InvalidTokenError:
        return 'Invalid token. Please log in again.'
```

Again, every authenticated request must include the auth token to verity the user's authenticity. Make sure the tests pass before moving on.
