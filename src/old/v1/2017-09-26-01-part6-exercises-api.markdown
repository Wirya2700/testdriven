---
title: Exercises API
layout: post
date: 2017-09-26 23:59:59
permalink: part-six-exercises-api
intro: false
part: 6
lesson: 5
share: true
---

In this lesson, we'll add an exercises API...

---

#### <span style="font-family:'Montserrat', 'sans-serif';">Check Your Understanding</span>

It's highly, highly recommended to do this all on your own! Put your skills to test!

##### Model

Set up an `Exercise` model with the following columns:

| Name                 | Type     | Example                    |
|----------------------|----------|----------------------------|
| `id`                 | integer  | 1                          |
| `exercise_body`      | string   | Define a function called sum that takes two integers as arguments and returns their sum.                   |
| `test_code`          | string   | sum(2, 2)                  |
| `test_code_solution` | string   | 4                          |
| `created_at`         | datetime | 2017-09-27 13:26:48.579621 |

##### Routes

| Endpoint   | HTTP Method | Authenticated? | Result            |
|------------|-------------|----------------|-------------------|
| /exercises | GET         | No             | get all exercises |
| /exercises | POST        | Yes (admin)    | add an exercise   |

#### <span style="font-family:'Montserrat', 'sans-serif';">Database Setup</span>

Steps:

1. Write a test
1. Add the model
1. Sanity check

##### Write a test

Start by adding an "exercises" folder to "project/tests", and then add a new file to "exercises" called *test_exercises_model.py*:

```python
# project/tests/exercises/test_exercises_model.py


from project import db
from project.api.exercises.models import Exercise
from project.tests.base import BaseTestCase
from project.tests.utils import add_exercise


class TestExerciseModel(BaseTestCase):

    def test_add_exercise(self):
        exercise = add_exercise()
        self.assertTrue(exercise.id)
        self.assertTrue(exercise.exercise_body)
        self.assertEqual(exercise.test_code, 'sum(2, 2)')
        self.assertEqual(exercise.test_code_solution, '4')
        self.assertTrue(exercise.created_at)
```

Don't forget to add an *\_\_init\_\_.py* file to "exercises". Then, add the `add_exercise` helper function to *utils.py*:

```python
def add_exercise(
        exercise_body='Define a function called sum that takes two integers as arguments and returns their sum',
        test_code='sum(2, 2)',
        test_code_solution='4',
        created_at=datetime.datetime.utcnow()):
    exercise = Exercise(
        exercise_body=exercise_body,
        test_code=test_code,
        test_code_solution=test_code_solution,
        created_at=created_at
    )
    db.session.add(exercise)
    db.session.commit()
    return exercise
```

Add the import as well:

```python
from project.api.exercises.models import Exercise
```

Ensure the tests fail.

##### Add the model

Add an "exercises" folder to "project/api", and then add a new file called *models.py* to "exercises":

```python
# project/api/exercises/models.py


import datetime

from project import db


class Exercise(db.Model):
    __tablename__ = "exercises"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    exercise_body = db.Column(db.String, nullable=False)
    test_code = db.Column(db.String, nullable=False)
    test_code_solution = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    def __init__(
            self, exercise_body, test_code, test_code_solution,
            created_at=datetime.datetime.utcnow()):
        self.exercise_body = exercise_body
        self.test_code = test_code
        self.test_code_solution = test_code_solution
        self.created_at = created_at
```

Add an *\_\_init\_\_.py* file to "exercises", and then run the tests. They should pass.

##### Sanity check

Be sure to add the import to *manage.py*:

```python
from project.api.exercises.models import Exercise
```

Recreate the database:

```sh
$ docker-compose run eval-service python manage.py recreate_db
```

Then, ensure the new model was applied:

```sh
$ docker exec -ti $(docker ps -aqf "name=eval-db") psql -U postgres

# \c eval_dev
You are now connected to database "eval_dev" as user "postgres".

# \dt
         List of relations
 Schema |  Name  | Type  |  Owner
--------+--------+-------+----------
 public | exercises | table | postgres
 public | scores    | table | postgres
(1 row)

# \q
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Routes</span>

Next, let's set up the following routes...

| Endpoint   | HTTP Method | Authenticated? | Result            |
|------------|-------------|----------------|-------------------|
| /exercises | GET         | No             | get all exercises |
| /exercises | POST        | Yes (admin)    | add an exercise   |

Process:

1. write a test
1. run the test to ensure it fails (**red**)
1. write just enough code to get the test to pass (**green**)
1. **refactor** (if necessary)

Files:

1. Test - *project/tests/exercises/test_exercises_api.py*
1. API - *project/api/exercises/exercises.py*

#### <span style="font-family:'Montserrat', 'sans-serif';">GET all exercises</span>

Test:

```python
def test_all_exercises(self):
    """Ensure get all exercises behaves correctly."""
    add_exercise()
    add_exercise(
        'Just a sample', 'print("Hello, World!")', 'Hello, World!')
    with self.client:
        response = self.client.get('/exercises')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['exercises']), 2)
        self.assertIn(
            'Define a function called sum',
            data['data']['exercises'][0]['exercise_body']
        )
        self.assertEqual(
            'Just a sample',
            data['data']['exercises'][1]['exercise_body']
        )
        self.assertEqual(
            'sum(2, 2)', data['data']['exercises'][0]['test_code'])
        self.assertEqual(
            'print("Hello, World!")',
            data['data']['exercises'][1]['test_code'])
        self.assertEqual(
            '4', data['data']['exercises'][0]['test_code_solution'])
        self.assertEqual(
            'Hello, World!',
            data['data']['exercises'][1]['test_code_solution'])
        self.assertTrue('created_at' in data['data']['exercises'][0])
        self.assertTrue('created_at' in data['data']['exercises'][1])
        self.assertIn('success', data['status'])
```

Route:

```python
@exercises_blueprint.route('/exercises', methods=['GET'])
def get_all_exercises():
    """Get all exercises"""
    exercises = Exercise.query.all()
    exercises_list = []
    for exercise in exercises:
        exercise_object = {
            'id': exercise.id,
            'exercise_body': exercise.exercise_body,
            'test_code': exercise.test_code,
            'test_code_solution': exercise.test_code_solution,
            'created_at': exercise.created_at,
        }
        exercises_list.append(exercise_object)
    response_object = {
        'status': 'success',
        'data': {
            'exercises': exercises_list
        }
    }
    return jsonify(response_object), 200
```

#### <span style="font-family:'Montserrat', 'sans-serif';">POST</span>

Tests:

```python
def test_add_exercise(self):
    """Ensure a new exercise can be added to the database."""
    with self.client:
        response = self.client.post(
            '/exercises',
            data=json.dumps(dict(
                exercise_body='Sample sample',
                test_code='get_sum(2, 2)',
                test_code_solution='4',
            )),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 201)
        self.assertIn('New exercise was added!', data['message'])
        self.assertIn('success', data['status'])

def test_add_exercise_invalid_json(self):
    """Ensure error is thrown if the JSON object is empty."""
    with self.client:
        response = self.client.post(
            '/exercises',
            data=json.dumps(dict()),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_add_exercise_invalid_json_keys(self):
    """Ensure error is thrown if the JSON object is invalid."""
    with self.client:
        response = self.client.post(
            '/exercises',
            data=json.dumps(dict(exercise_body='test')),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_add_exercise_no_header(self):
    """Ensure error is thrown if 'Authorization' header is empty."""
    response = self.client.post(
        '/exercises',
        data=json.dumps(dict(
            exercise_body='Sample sample',
            test_code='get_sum(2, 2)',
            test_code_solution='4',
        )),
        content_type='application/json'
    )
    data = json.loads(response.data.decode())
    self.assertEqual(response.status_code, 403)
    self.assertIn('Provide a valid auth token.', data['message'])
    self.assertIn('error', data['status'])
```

Route:

```python
@exercises_blueprint.route('/exercises', methods=['POST'])
@authenticate
def add_exercise(resp):
    """Add exercise"""
    if not resp['admin']:
        response_object = {
            'status': 'error',
            'message': 'You do not have permission to do that.'
        }
        return jsonify(response_object), 401
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    exercise_body = post_data.get('exercise_body')
    test_code = post_data.get('test_code')
    test_code_solution = post_data.get('test_code_solution')
    try:
        db.session.add(Exercise(
            exercise_body=exercise_body,
            test_code=test_code,
            test_code_solution=test_code_solution))
        db.session.commit()
        response_object = {
            'status': 'success',
            'message': 'New exercise was added!'
        }
        return jsonify(response_object), 201
    except (exc.IntegrityError, ValueError) as e:
        db.session().rollback()
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check</span>

Do the tests pass?

```sh
$ docker-compose run eval-service python manage.py test
```

Did code coverage increase?

```sh
$ docker-compose run eval-service python manage.py cov
```

It went down about 1% on my end. Why?

```sh
Coverage Summary:
Name                                 Stmts   Miss Branch BrPart  Cover
----------------------------------------------------------------------
project/__init__.py                     21      8      0      0    62%
project/api/eval.py                      8      0      0      0   100%
project/api/exercises/exercises.py      35      2      6      1    93%
project/api/exercises/models.py         14     10      0      0    29%
project/api/scores/models.py            16     11      0      0    31%
project/api/scores/scores.py           111      1     20      1    98%
project/api/utils.py                    33     11      8      2    63%
project/config.py                       19      0      0      0   100%
----------------------------------------------------------------------
TOTAL                                  257     43     34      4    83%
```

Write any additional routes and tests. Once done, commit and push your code to GitHub.
