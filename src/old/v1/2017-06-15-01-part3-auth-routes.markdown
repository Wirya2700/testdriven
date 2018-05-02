---
title: Auth Routes
layout: post
date: 2017-06-15 23:59:59
permalink: part-three-auth-routes
intro: false
part: 3
lesson: 5
share: true
---

Now we can configure the authentication routes...

---

Before we add the new routes, let's refactor the current API. Start by renaming *flask-microservices-users/project/api/views.py* to *flask-microservices-users/project/api/users.py* Then, within *flask-microservices-users/project/\_\_init\_\_.py*, update the import:

```python
...
# register blueprints
from project.api.users import users_blueprint
...
```

Run the tests to make sure nothing broke.

#### <span style="font-family:'Montserrat', 'sans-serif';">Routes Setup</span>

| Endpoint        | HTTP Method | Authenticated?  | Result          |
|-----------------|-------------|-----------------|-----------------|
| /auth/register  | POST        | No              | register a user |
| /auth/login     | POST        | No              | log in a user   |
| /auth/logout    | GET         | Yes             | log out a user  |
| /auth/status    | GET         | Yes             | get user status |

Add a new file to the "api" directory called *auth.py*:

```python
# project/api/auth.py


from flask import Blueprint, jsonify, request
from sqlalchemy import exc, or_

from project.api.models import User
from project import db, bcrypt


auth_blueprint = Blueprint('auth', __name__)
```

Then, register the new Blueprint with the app in *project/\_\_init\_\_.py*:

```python
...
# register blueprints
from project.api.users import users_blueprint
from project.api.auth import auth_blueprint
app.register_blueprint(auth_blueprint)
app.register_blueprint(users_blueprint)
...
```

Add a new file called *test_auth.py* to the "tests" folder to hold all tests associated with the Blueprint:

```python
# project/tests/test_auth.py


import json

from project import db
from project.api.models import User
from project.tests.base import BaseTestCase
from project.tests.utils import add_user


class TestAuthBlueprint(BaseTestCase):
    pass
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Register Route</span>

Start with a test:

```python
def test_user_registration(self):
    with self.client:
        response = self.client.post(
            '/auth/register',
            data=json.dumps(dict(
                username='justatest',
                email='test@test.com',
                password='123456'
            )),
            content_type='application/json'
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'success')
        self.assertTrue(data['message'] == 'Successfully registered.')
        self.assertTrue(data['auth_token'])
        self.assertTrue(response.content_type == 'application/json')
        self.assertEqual(response.status_code, 201)
```

This only tests the happy path. What about failures?

1. email exists
1. username exists
1. invalid payload (empty, no username, no email, no password)

```python
def test_user_registration_duplicate_email(self):
    add_user('test', 'test@test.com', 'test')
    with self.client:
        response = self.client.post(
            '/auth/register',
            data=json.dumps(dict(
                username='michael',
                email='test@test.com',
                password='test'
            )),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            'Sorry. That user already exists.', data['message'])
        self.assertIn('error', data['status'])

def test_user_registration_duplicate_username(self):
    add_user('test', 'test@test.com', 'test')
    with self.client:
        response = self.client.post(
            '/auth/register',
            data=json.dumps(dict(
                username='test',
                email='test@test.com2',
                password='test'
            )),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            'Sorry. That user already exists.', data['message'])
        self.assertIn('error', data['status'])

def test_user_registration_invalid_json(self):
    with self.client:
        response = self.client.post(
            '/auth/register',
            data=json.dumps(dict()),
            content_type='application/json'
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('error', data['status'])

def test_user_registration_invalid_json_keys_no_username(self):
    with self.client:
        response = self.client.post(
            '/auth/register',
            data=json.dumps(dict(email='test@test.com', password='test')),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('error', data['status'])

def test_user_registration_invalid_json_keys_no_email(self):
    with self.client:
        response = self.client.post(
            '/auth/register',
            data=json.dumps(dict(
                username='justatest', password='test')),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('error', data['status'])

def test_user_registration_invalid_json_keys_no_password(self):
    with self.client:
        response = self.client.post(
            '/auth/register',
            data=json.dumps(dict(
                username='justatest', email='test@test.com')),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('error', data['status'])
```

Ensure the tests fail, and then add the view:

```python
@auth_blueprint.route('/auth/register', methods=['POST'])
def register_user():
    # get post data
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'error',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    username = post_data.get('username')
    email = post_data.get('email')
    password = post_data.get('password')
    try:
        # check for existing user
        user = User.query.filter(
            or_(User.username == username, User.email==email)).first()
        if not user:
            # add new user to db
            new_user = User(
                username=username,
                email=email,
                password=password
            )
            db.session.add(new_user)
            db.session.commit()
            # generate auth token
            auth_token = new_user.encode_auth_token(new_user.id)
            response_object = {
                'status': 'success',
                'message': 'Successfully registered.',
                'auth_token': auth_token.decode()
            }
            return jsonify(response_object), 201
        else:
            response_object = {
                'status': 'error',
                'message': 'Sorry. That user already exists.'
            }
            return jsonify(response_object), 400
    # handler errors
    except (exc.IntegrityError, ValueError) as e:
        db.session.rollback()
        response_object = {
            'status': 'error',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Login Route</span>

Again, start with a few tests:

```python
def test_registered_user_login(self):
    with self.client:
        user = add_user('test', 'test@test.com', 'test')
        response = self.client.post(
            '/auth/login',
            data=json.dumps(dict(
                email='test@test.com',
                password='test'
            )),
            content_type='application/json'
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'success')
        self.assertTrue(data['message'] == 'Successfully logged in.')
        self.assertTrue(data['auth_token'])
        self.assertTrue(response.content_type == 'application/json')
        self.assertEqual(response.status_code, 200)

def test_not_registered_user_login(self):
    with self.client:
        response = self.client.post(
            '/auth/login',
            data=json.dumps(dict(
                email='test@test.com',
                password='test'
            )),
            content_type='application/json'
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'error')
        self.assertTrue(data['message'] == 'User does not exist.')
        self.assertTrue(response.content_type == 'application/json')
        self.assertEqual(response.status_code, 404)
```

Run the tests. They should fail. Now write the code:

```python
@auth_blueprint.route('/auth/login', methods=['POST'])
def login_user():
    # get post data
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'error',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    email = post_data.get('email')
    password = post_data.get('password')
    try:
        # fetch the user data
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            auth_token = user.encode_auth_token(user.id)
            if auth_token:
                response_object = {
                    'status': 'success',
                    'message': 'Successfully logged in.',
                    'auth_token': auth_token.decode()
                }
                return jsonify(response_object), 200
        else:
            response_object = {
                'status': 'error',
                'message': 'User does not exist.'
            }
            return jsonify(response_object), 404
    except Exception as e:
        print(e)
        response_object = {
            'status': 'error',
            'message': 'Try again.'
        }
        return jsonify(response_object), 500
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Logout Route</span>

Test valid logout:

```python
def test_valid_logout(self):
    add_user('test', 'test@test.com', 'test')
    with self.client:
        # user login
        resp_login = self.client.post(
            '/auth/login',
            data=json.dumps(dict(
                email='test@test.com',
                password='test'
            )),
            content_type='application/json'
        )
        # valid token logout
        response = self.client.get(
            '/auth/logout',
            headers=dict(
                Authorization='Bearer ' + json.loads(
                    resp_login.data.decode()
                )['auth_token']
            )
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'success')
        self.assertTrue(data['message'] == 'Successfully logged out.')
        self.assertEqual(response.status_code, 200)
```

Test invalid logout:

```python
def test_invalid_logout_expired_token(self):
    add_user('test', 'test@test.com', 'test')
    with self.client:
        resp_login = self.client.post(
            '/auth/login',
            data=json.dumps(dict(
                email='test@test.com',
                password='test'
            )),
            content_type='application/json'
        )
        # invalid token logout
        time.sleep(4)
        response = self.client.get(
            '/auth/logout',
            headers=dict(
                Authorization='Bearer ' + json.loads(
                    resp_login.data.decode()
                )['auth_token']
            )
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'error')
        self.assertTrue(
            data['message'] == 'Signature expired. Please log in again.')
        self.assertEqual(response.status_code, 401)

def test_invalid_logout(self):
    with self.client:
        response = self.client.get(
            '/auth/logout',
            headers=dict(Authorization='Bearer invalid'))
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'error')
        self.assertTrue(
            data['message'] == 'Invalid token. Please log in again.')
        self.assertEqual(response.status_code, 401)
```

Add the import:

```python
import time
```

Update the views:

```python
@auth_blueprint.route('/auth/logout', methods=['GET'])
def logout_user():
    # get auth token
    auth_header = request.headers.get('Authorization')
    if auth_header:
        auth_token = auth_header.split(" ")[1]
        resp = User.decode_auth_token(auth_token)
        if not isinstance(resp, str):
            response_object = {
                'status': 'success',
                'message': 'Successfully logged out.'
            }
            return jsonify(response_object), 200
        else:
            response_object = {
                'status': 'error',
                'message': resp
            }
            return jsonify(response_object), 401
    else:
        response_object = {
            'status': 'error',
            'message': 'Provide a valid auth token.'
        }
        return jsonify(response_object), 403
```

Run the tests:

```sh
Ran 31 tests in 6.683s

OK
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Status Route</span>

Remember: In order to get the user details of the currently logged in user, the auth token *must* be sent with the request.

Start with some tests:

```python
def test_user_status(self):
    add_user('test', 'test@test.com', 'test')
    with self.client:
        resp_login = self.client.post(
            '/auth/login',
            data=json.dumps(dict(
                email='test@test.com',
                password='test'
            )),
            content_type='application/json'
        )
        response = self.client.get(
            '/auth/status',
            headers=dict(
                Authorization='Bearer ' + json.loads(
                    resp_login.data.decode()
                )['auth_token']
            )
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'success')
        self.assertTrue(data['data'] is not None)
        self.assertTrue(data['data']['username'] == 'test')
        self.assertTrue(data['data']['email'] == 'test@test.com')
        self.assertTrue(data['data']['active'] is True)
        self.assertTrue(data['data']['created_at'])
        self.assertEqual(response.status_code, 200)

def test_invalid_status(self):
    with self.client:
        response = self.client.get(
            '/auth/status',
            headers=dict(Authorization='Bearer invalid'))
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'error')
        self.assertTrue(
            data['message'] == 'Invalid token. Please log in again.')
        self.assertEqual(response.status_code, 401)
```

The tests should fail. Now, in the route handler, we should:

1. extract the auth token and check its validity
1. grab the user id from the payload and get the user details (if the token is valid, of course)

```python
@auth_blueprint.route('/auth/status', methods=['GET'])
def get_user_status():
    # get auth token
    auth_header = request.headers.get('Authorization')
    if auth_header:
        auth_token = auth_header.split(" ")[1]
        resp = User.decode_auth_token(auth_token)
        if not isinstance(resp, str):
            user = User.query.filter_by(id=resp).first()
            response_object = {
                'status': 'success',
                'data': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'active': user.active,
                    'created_at': user.created_at
                }
            }
            return jsonify(response_object), 200
        response_object = {
            'status': 'error',
            'message': resp
        }
        return jsonify(response_object), 401
    else:
        response_object = {
            'status': 'error',
            'message': 'Provide a valid auth token.'
        }
        return jsonify(response_object), 401
```

Test one final time.

```sh
Ran 33 tests in 6.684s

OK
Coverage Summary:
Name                    Stmts   Miss Branch BrPart  Cover
---------------------------------------------------------
project/__init__.py        22     10      0      0    55%
project/api/auth.py        77     10     20      4    86%
project/api/models.py      31     17      2      0    48%
project/api/users.py       50      0     10      0   100%
project/config.py          19      0      0      0   100%
---------------------------------------------------------
TOTAL                     199     37     32      4    82%
```

Then update `seed_db()` in *manage.py*:

```python
@manager.command
def seed_db():
    """Seeds the database."""
    db.session.add(User(
        username='michael',
        email='michael@realpython.com',
        password='test'
    ))
    db.session.add(User(
        username='michaelherman',
        email='michael@mherman.org',
        password='test'
    ))
    db.session.commit()
```

Commit and push your code. Do the tests pass on Travis CI? You should see some errors since we did not set the `SECRET_KEY`. Add the export to the `before_script`:

```
before_script:
  - export APP_SETTINGS="project.config.TestingConfig"
  - export DATABASE_TEST_URL=postgresql://postgres:@localhost/users_test
  - export SECRET_KEY=changeme
  - psql -c 'create database users_test;' -U postgres
  - python manage.py recreate_db
```

Commit and push your code again.
