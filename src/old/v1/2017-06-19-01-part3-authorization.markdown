---
title: Authorization
layout: post
date: 2017-06-19 23:59:59
permalink: part-three-authorization
intro: false
part: 3
lesson: 9
share: true
---

With authentication done we can now turn our attention to authorization...

---

First, some definitions:

1. *Authentication* - verifying (via user credentials) that the user is who they say they are
1. *Authorization* - ensuring (via permissions) that a user is allowed to do something

> Review [Authentication vs. Authorization on Wikipedia](https://en.wikipedia.org/wiki/Authentication#Authorization) for more info.

Navigate to *flask-microservices-users*, activate the virtual environment, add the environment variables, and then run the tests to ensure they pass:

```sh
$ source env/bin/activate
(env)$ export APP_SETTINGS=project.config.DevelopmentConfig
(env)$ export DATABASE_URL=postgres://postgres:postgres@localhost:5432/users_dev
(env)$ export DATABASE_TEST_URL=postgres://postgres:postgres@localhost:5432/users_test
(env)$ export SECRET_KEY=my_precious
(env)$ python manage.py test
```

> You may need to change the username and password depending on your local Postgres config.

Routes:

| Endpoint        | HTTP Method | Authenticated?  | Active?   | Admin? |
|-----------------|-------------|-----------------|-----------|--------|
| /auth/register  | POST        | No              | N/A       | N/A    |
| /auth/login     | POST        | No              | N/A       | N/A    |
| /auth/logout    | GET         | Yes             | Yes       | No     |
| /auth/status    | GET         | Yes             | Yes       | No     |
| /users          | GET         | No              | N/A       | N/A    |
| /users/:id      | GET         | No              | N/A       | N/A    |
| /users          | POST        | Yes             | Yes       | Yes    |

So, for routes that you must be authenticated to view, you must be active. You also must be an admin to POST to the `/users` endpoint.

#### <span style="font-family:'Montserrat', 'sans-serif';">Active</span>

Start with a test. Add the following to *flask-microservices-users/project/tests/test_auth.py*:

```python
def test_invalid_logout_inactive(self):
    add_user('test', 'test@test.com', 'test')
    # update user
    user = User.query.filter_by(email='test@test.com').first()
    user.active = False
    db.session.commit()
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
            data['message'] == 'Something went wrong. Please contact us.')
        self.assertEqual(response.status_code, 401)
```

Ensure the tests fail, and then update `logout_user()` in *project/api/auth.py*:

```python
@auth_blueprint.route('/auth/logout', methods=['GET'])
def logout_user():
    # get auth token
    auth_header = request.headers.get('Authorization')
    if auth_header:
        auth_token = auth_header.split(" ")[1]
        resp = User.decode_auth_token(auth_token)
        if not isinstance(resp, str):
            user = User.query.filter_by(id=resp).first()
            if not user or not user.active:
                response_object = {
                    'status': 'error',
                    'message': 'Something went wrong. Please contact us.'
                }
                return jsonify(response_object), 401
            else:
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

Before moving on, let's do a quick refactor to keep our code DRY. We can move the auth logic out of the route handler and into a decorator.

Create a new file in "project/api" called *utils.py*:

```python
# project/api/utils.py


from functools import wraps

from flask import request, jsonify

from project.api.models import User


def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response_object = {
            'status': 'error',
            'message': 'Something went wrong. Please contact us.'
        }
        code = 401
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            response_object['message'] = 'Provide a valid auth token.'
            code = 403
            return jsonify(response_object), code
        auth_token = auth_header.split(" ")[1]
        resp = User.decode_auth_token(auth_token)
        if isinstance(resp, str):
            response_object['message'] = resp
            return jsonify(response_object), code
        user = User.query.filter_by(id=resp).first()
        if not user or not user.active:
            return jsonify(response_object), code
        return f(resp, *args, **kwargs)
    return decorated_function
```

Here, we abstracted out all the logic for ensuring a token is present and valid and that the associated user is active.

Import the decorator into *project/api/auth.py*:

```python
from project.api.utils import authenticate
```

Update the view:

```python
@auth_blueprint.route('/auth/logout', methods=['GET'])
@authenticate
def logout_user(resp):
    response_object = {
        'status': 'success',
        'message': 'Successfully logged out.'
    }
    return jsonify(response_object), 200
```

The code is DRY and now we can test the auth logic separate from the view in a unit test! Win-win. Let's do the same thing for the `/auth/status` endpoint.

Add the test:

```python
def test_invalid_status_inactive(self):
    add_user('test', 'test@test.com', 'test')
    # update user
    user = User.query.filter_by(email='test@test.com').first()
    user.active = False
    db.session.commit()
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
        self.assertTrue(data['status'] == 'error')
        self.assertTrue(
            data['message'] == 'Something went wrong. Please contact us.')
        self.assertEqual(response.status_code, 401)
```

Now, update `get_user_status()`:

```python
@auth_blueprint.route('/auth/status', methods=['GET'])
@authenticate
def get_user_status(resp):
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
```

Make sure the tests pass.

Moving on, for the `/users` POST endpoint, add a new test:

```python
def test_add_user_inactive(self):
    add_user('test', 'test@test.com', 'test')
    # update user
    user = User.query.filter_by(email='test@test.com').first()
    user.active = False
    db.session.commit()
    with self.client:
        resp_login = self.client.post(
            '/auth/login',
            data=json.dumps(dict(
                email='test@test.com',
                password='test'
            )),
            content_type='application/json'
        )
        response = self.client.post(
            '/users',
            data=json.dumps(dict(
                username='michael',
                email='michael@realpython.com',
                password='test'
            )),
            content_type='application/json',
            headers=dict(
                Authorization='Bearer ' + json.loads(
                    resp_login.data.decode()
                )['auth_token']
            )
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'error')
        self.assertTrue(
            data['message'] == 'Something went wrong. Please contact us.')
        self.assertEqual(response.status_code, 401)
```

Make sure it fails, and then add the decorator to `add_user()` in *project/api/users.py*:

```python
@users_blueprint.route('/users', methods=['POST'])
@authenticate
def add_user(resp):
    ...
```

Run the tests. You should see a number of failures since we are not passing a valid token within the requests in the remaining tests for that endpoint. To fix, in each of the failing tests, you need to-

1. add a user

    ```python
    add_user('test', 'test@test.com', 'test')
    ```

1. log the user in

    ```python
    resp_login = self.client.post(
        '/auth/login',
        data=json.dumps(dict(
            email='test@test.com',
            password='test'
        )),
        content_type='application/json'
    )
    ```

1. add the token to the requests

    ```python
    self.client.post(
        '/users',
        data=json.dumps(dict(
            username='michael',
            email='michael@realpython.com',
            password='test'
        )),
        content_type='application/json',
        headers=dict(
            Authorization='Bearer ' + json.loads(
                resp_login.data.decode()
            )['auth_token']
        )
    )
    ```

Refactor. Test again to make sure they pass.

#### <span style="font-family:'Montserrat', 'sans-serif';">Admin</span>

Finally, in order to POST to the `/users` endpoint, you must be an admin. Turn to the models. Do we have an admin property? No. Let's add one. Start by adding an additional assert to the `test_add_user` test in *project/tests/test_user_model.py*:

```python
def test_add_user(self):
    user = add_user('justatest', 'test@test.com', 'test')
    self.assertTrue(user.id)
    self.assertEqual(user.username, 'justatest')
    self.assertEqual(user.email, 'test@test.com')
    self.assertTrue(user.password)
    self.assertTrue(user.active)
    self.assertTrue(user.created_at)
    self.assertTrue(user.admin == False)
```

After the tests fail, add the property to the model:

```python
admin = db.Column(db.Boolean, default=False, nullable=False)
```

Create the migration:

```sh
(env) $ python manage.py db migrate
```

Drop the `users_dev` database, and then re-create it. Apply the migrations:

```sh
(env) $ python manage.py db upgrade
```

> We had to drop the database since the existing users did not have the admin property. Since it was required, we could not apply the migration. If you wanted to maintain the existing users, you could set `nullable` as `True`. Apply the migration, update the existing users, and then create a new migration to set `nullable` as `False`.

The tests should pass. Next, let's add a new test to *project/tests/test_users.py*:

```python
def test_add_user_not_admin(self):
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
        response = self.client.post(
            '/users',
            data=json.dumps(dict(
                username='michael',
                email='michael@realpython.com',
                password='test'
            )),
            content_type='application/json',
            headers=dict(
                Authorization='Bearer ' + json.loads(
                    resp_login.data.decode()
                )['auth_token']
            )
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'error')
        self.assertTrue(
            data['message'] == 'You do not have permission to do that.')
        self.assertEqual(response.status_code, 401)
```

Add a helper to *project/api/utils.py*:

```python
def is_admin(user_id):
    user = User.query.filter_by(id=user_id).first()
    return user.admin
```

Import it in to *project/api/users.py*, and then add the check to the top of the function:

```python
@users_blueprint.route('/users', methods=['POST'])
@authenticate
def add_user(resp):
    if not is_admin(resp):
        response_object = {
            'status': 'error',
            'message': 'You do not have permission to do that.'
        }
        return jsonify(response_object), 401
```

Run the tests. There will be a number of failures. Add the following to the top of the failing tests, right after `add_user('test', 'test@test.com', 'test')`:

```python
# update user
user = User.query.filter_by(email='test@test.com').first()
user.admin = True
db.session.commit()
```

Test it again. Once they pass, commit your code and move on.

> It's probably a good time to refactor some of the tests to keep them DRY. Do this on your own.
