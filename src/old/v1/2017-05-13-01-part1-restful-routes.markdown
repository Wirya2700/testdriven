---
title: RESTful Routes
layout: post
date: 2017-05-13 23:59:57
permalink: part-one-restful-routes
intro: false
part: 1
lesson: 7
share: true
---

Next, let's set up three new routes, following RESTful best practices, with TDD:

| Endpoint    | HTTP Method | CRUD Method | Result          |
|-------------|-------------|-------------|-----------------|
| /users      | GET         | READ        | get all users   |
| /users/:id  | GET         | READ        | get single user |
| /users      | POST        | CREATE      | add a user      |

For each, we'll-

1. write a test
1. run the test, watching it fail (**red**)
1. write just enough code to get the test to pass (**green**)
1. **refactor** (if necessary)

Let's start with the POST route...

#### <span style="font-family:'Montserrat', 'sans-serif';">POST</span>

Add the test to the `TestUserService()` class in *project/tests/test_users.py*:

```python
def test_add_user(self):
    """Ensure a new user can be added to the database."""
    with self.client:
        response = self.client.post(
            '/users',
            data=json.dumps(dict(
                username='michael',
                email='michael@realpython.com'
            )),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 201)
        self.assertIn('michael@realpython.com was added!', data['message'])
        self.assertIn('success', data['status'])
```

Run the test to ensure it fails:

```sh
$ docker-compose run users-service python manage.py test
```

Then add the route handler to *project/api/views.py*

```python
@users_blueprint.route('/users', methods=['POST'])
def add_user():
    post_data = request.get_json()
    username = post_data.get('username')
    email = post_data.get('email')
    db.session.add(User(username=username, email=email))
    db.session.commit()
    response_object = {
        'status': 'success',
        'message': f'{email} was added!'
    }
    return jsonify(response_object), 201
```

Update the imports as well:

```python
from flask import Blueprint, jsonify, request

from project.api.models import User
from project import db
```

Run the tests. They all should pass:

```sh
Ran 5 tests in 0.201s

OK
```

What about errors and exceptions? Like:

1. A payload is not sent
1. The payload is invalid - i.e., the JSON object is empty or it contains the wrong keys
1. The user already exists in the database

Add some tests:

```python
def test_add_user_invalid_json(self):
    """Ensure error is thrown if the JSON object is empty."""
    with self.client:
        response = self.client.post(
            '/users',
            data=json.dumps(dict()),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_add_user_invalid_json_keys(self):
    """Ensure error is thrown if the JSON object does not have a username key."""
    with self.client:
        response = self.client.post(
            '/users',
            data=json.dumps(dict(email='michael@realpython.com')),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_add_user_duplicate_user(self):
    """Ensure error is thrown if the email already exists."""
    with self.client:
        self.client.post(
            '/users',
            data=json.dumps(dict(
                username='michael',
                email='michael@realpython.com'
            )),
            content_type='application/json',
        )
        response = self.client.post(
            '/users',
            data=json.dumps(dict(
                username='michael',
                email='michael@realpython.com'
            )),
            content_type='application/json',
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            'Sorry. That email already exists.', data['message'])
        self.assertIn('fail', data['status'])
```

Ensure the tests fail, and then update the route handler:

```python
@users_blueprint.route('/users', methods=['POST'])
def add_user():
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    username = post_data.get('username')
    email = post_data.get('email')
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            db.session.add(User(username=username, email=email))
            db.session.commit()
            response_object = {
                'status': 'success',
                'message': f'{email} was added!'
            }
            return jsonify(response_object), 201
        else:
            response_object = {
                'status': 'fail',
                'message': 'Sorry. That email already exists.'
            }
            return jsonify(response_object), 400
    except exc.IntegrityError as e:
        db.session.rollback()
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
```

Add the import:

```python
from sqlalchemy import exc
```

Ensure the tests pass, and then move on to the next route...

#### <span style="font-family:'Montserrat', 'sans-serif';">GET Single User</span>

Start with a test:

```python
def test_single_user(self):
    """Ensure get single user behaves correctly."""
    user = User(username='michael', email='michael@realpython.com')
    db.session.add(user)
    db.session.commit()
    with self.client:
        response = self.client.get(f'/users/{user.id}')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertTrue('created_at' in data['data'])
        self.assertIn('michael', data['data']['username'])
        self.assertIn('michael@realpython.com', data['data']['email'])
        self.assertIn('success', data['status'])
```

Add the following imports:

```python
from project import db
from project.api.models import User
```

Ensure the test breaks before writing the view:

```python
@users_blueprint.route('/users/<user_id>', methods=['GET'])
def get_single_user(user_id):
    """Get single user details"""
    user = User.query.filter_by(id=user_id).first()
    response_object = {
        'status': 'success',
        'data': {
          'username': user.username,
          'email': user.email,
          'created_at': user.created_at
        }
    }
    return jsonify(response_object), 200
```

The tests should pass. Now, what about error handling?

1. An id is not provided
1. The id does not exist

Tests:

```python
def test_single_user_no_id(self):
    """Ensure error is thrown if an id is not provided."""
    with self.client:
        response = self.client.get('/users/blah')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 404)
        self.assertIn('User does not exist', data['message'])
        self.assertIn('fail', data['status'])

def test_single_user_incorrect_id(self):
    """Ensure error is thrown if the id does not exist."""
    with self.client:
        response = self.client.get('/users/999')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 404)
        self.assertIn('User does not exist', data['message'])
        self.assertIn('fail', data['status'])
```

Updated view:

```python
@users_blueprint.route('/users/<user_id>', methods=['GET'])
def get_single_user(user_id):
    """Get single user details"""
    response_object = {
        'status': 'fail',
        'message': 'User does not exist'
    }
    try:
        user = User.query.filter_by(id=int(user_id)).first()
        if not user:
            return jsonify(response_object), 404
        else:
            response_object = {
                'status': 'success',
                'data': {
                  'username': user.username,
                  'email': user.email,
                  'created_at': user.created_at
                }
            }
            return jsonify(response_object), 200
    except ValueError:
        return jsonify(response_object), 404
```

#### <span style="font-family:'Montserrat', 'sans-serif';">GET All Users</span>

Again, let's start with a test. Since we'll have to add a few users first, let's add a quick helper function to the top of the *project/tests/test_users.py* file, just above the `TestUserService()` class.

```python
def add_user(username, email):
    user = User(username=username, email=email)
    db.session.add(user)
    db.session.commit()
    return user
```

Now, refactor the *test_single_user()* test, like so:

```python
def test_single_user(self):
    """Ensure get single user behaves correctly."""
    user = add_user('michael', 'michael@realpython.com')
    with self.client:
        response = self.client.get(f'/users/{user.id}')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertTrue('created_at' in data['data'])
        self.assertIn('michael', data['data']['username'])
        self.assertIn('michael@realpython.com', data['data']['email'])
        self.assertIn('success', data['status'])
```

With that, let's add the new test:

```python
def test_all_users(self):
    """Ensure get all users behaves correctly."""
    add_user('michael', 'michael@realpython.com')
    add_user('fletcher', 'fletcher@realpython.com')
    with self.client:
        response = self.client.get('/users')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['users']), 2)
        self.assertTrue('created_at' in data['data']['users'][0])
        self.assertTrue('created_at' in data['data']['users'][1])
        self.assertIn('michael', data['data']['users'][0]['username'])
        self.assertIn(
            'michael@realpython.com', data['data']['users'][0]['email'])
        self.assertIn('fletcher', data['data']['users'][1]['username'])
        self.assertIn(
            'fletcher@realpython.com', data['data']['users'][1]['email'])
        self.assertIn('success', data['status'])
```

Make sure it fails. Then add the view:

```python
@users_blueprint.route('/users', methods=['GET'])
def get_all_users():
    """Get all users"""
    users = User.query.all()
    users_list = []
    for user in users:
        user_object = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at
        }
        users_list.append(user_object)
    response_object = {
        'status': 'success',
        'data': {
            'users': users_list
        }
    }
    return jsonify(response_object), 200
```

Does the test past?

Before moving on, let's test the route in the browser - [http://YOUR-IP:5001/users](http://YOUR-IP:5001/users). You should see:

```json
{
  "data": {
    "users": [ ]
  },
  "status": "success"
}
```

Add a seed command to the *manage.py* file to populate the database with some initial data:

```python
@manager.command
def seed_db():
    """Seeds the database."""
    db.session.add(User(username='michael', email="michael@realpython.com"))
    db.session.add(User(username='michaelherman', email="michael@mherman.org"))
    db.session.commit()
```

Try it out:

```sh
$ docker-compose run users-service python manage.py seed_db
```

Make sure you can view the users in the JSON response [http://YOUR-IP:5001/users](http://YOUR-IP:5001/users).
