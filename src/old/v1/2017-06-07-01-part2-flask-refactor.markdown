---
title: Flask Refactor
layout: post
date: 2017-06-07 23:59:59
permalink: part-two-flask-refactor
intro: false
part: 2
lesson: 9
share: true
---

In this lesson, we'll refactor part of the users service...

---

Navigate to *flask-microservices-users*, activate the virtual environment, add the environment variables, and then run the tests:

```sh
$ source env/bin/activate
(env)$ export APP_SETTINGS=project.config.DevelopmentConfig
(env)$ export DATABASE_URL=postgres://postgres:postgres@localhost:5432/users_dev
(env)$ export DATABASE_TEST_URL=postgres://postgres:postgres@localhost:5432/users_test
(env)$ python manage.py test
```

> You may need to change the username and password depending on your local Postgres config.

#### <span style="font-family:'Montserrat', 'sans-serif';">Remove Main Route</span>

Since we are now using the users service simply as a RESTful API, remove the main route:

```python
@users_blueprint.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        db.session.add(User(username=username, email=email))
        db.session.commit()
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('index.html', users=users)
```

Run the tests again. This time three should fail:

```sh
FAIL: test_main_add_user (test_users.TestUserService)
FAIL: test_main_no_users (test_users.TestUserService)
FAIL: test_main_with_users (test_users.TestUserService)
```

Remove them from *flask-microservices-users/project/tests/test_users.py*, and then run the tests again. All should pass. Remove the "templates" directory as well.

#### <span style="font-family:'Montserrat', 'sans-serif';">Order Users By Date</span>

Next, let's update the GET ALL `/users` route to order the users by `created_at` date descending.

We'll start with a test of course, but first we need to change the functionality of the `add_user()` helper so that we can pass it an optional `created_at` date. Why? So, we can easily seed the database with users created in the past.

```python
def add_user(username, email, created_at=datetime.datetime.utcnow()):
    user = User(username=username, email=email, created_at=created_at)
    db.session.add(user)
    db.session.commit()
    return user
```

Then, update the `__init__` method in *flask-microservices-users/project/api/models.py* to take an optional argument as well:

```python
def __init__(self, username, email, created_at=datetime.datetime.utcnow()):
    self.username = username
    self.email = email
    self.created_at = created_at
```

Run the tests to make sure we didn't break anything. Now, we can update the `test_all_users()` test:

```python
def test_all_users(self):
    """Ensure get all users behaves correctly."""
    created = datetime.datetime.utcnow() + datetime.timedelta(-30)
    add_user('michael', 'michael@realpython.com', created)
    add_user('fletcher', 'fletcher@realpython.com')
    with self.client:
        response = self.client.get('/users')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['users']), 2)
        self.assertTrue('created_at' in data['data']['users'][0])
        self.assertTrue('created_at' in data['data']['users'][1])
        self.assertIn('michael', data['data']['users'][1]['username'])
        self.assertIn(
            'michael@realpython.com', data['data']['users'][1]['email'])
        self.assertIn('fletcher', data['data']['users'][0]['username'])
        self.assertIn(
            'fletcher@realpython.com', data['data']['users'][0]['email'])
        self.assertIn('success', data['status'])
```

What's different?

1. We defined a date in the past, `created`, and used it for `michael`.
1. Since `michael` has a `created_at` date in the past, we asserted that the user is second in the list.

The test should fail. To get this to pass, we need to update the view to order by date descending in the SQL query:

```python
@users_blueprint.route('/users', methods=['GET'])
def get_all_users():
    """Get all users"""
    users = User.query.order_by(User.created_at.desc()).all()
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

Run the tests! Deactivate the virtual environment. Commit and push your code. Did the tests pass on Travis CI?

#### <span style="font-family:'Montserrat', 'sans-serif';">Update Docker</span>

Set the `dev` machine as the active machine and update the containers:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
$ docker-compose up -d --build
```

Navigate *flask-microservices-main*, and make sure the tests pass:

```sh
$ docker-compose run users-service python manage.py test
```

Test in the browser as well.

Do the same for production: Set the `aws` machine as the active machine and update the containers:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_AWS_IP
$ docker-compose -f docker-compose-prod.yml up -d --build
```

Test!

#### <span style="font-family:'Montserrat', 'sans-serif';">Next Steps</span>

Now is a great time to pause, review the code, and write more unit and integration tests. Do this on your own to check your understanding.

> Want feedback on your code? Shoot an email to `michael@realpython.com` with a link to the GitHub repo. Cheers!
