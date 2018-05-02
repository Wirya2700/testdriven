---
title: Scores API Routes
layout: post
date: 2017-09-25 23:59:59
permalink: part-six-scores-api-routes
intro: false
part: 6
lesson: 4
share: true
---

Next, let's set up six new routes, following RESTful best practices:

| Endpoint             | HTTP Method | Authenticated? | Result                 |
|----------------------|--------|----------------|-----------------------------|
| /scores              | GET    | No             | get all scores              |
| /scores/:id          | GET    | No             | get single score            |
| /scores/user         | GET    | Yes            | get all scores by user id   |
| /scores/user/:id     | GET    | Yes            | get single score by user id |
| /scores              | POST   | Yes            | add a score                 |
| /scores/:id          | PUT    | Yes            | update a score              |
| /scores          | PATCH  | Yes            | upsert (update or add if the score does not exist)             |

Process:

1. write a test
1. run the test to ensure it fails (**red**)
1. write just enough code to get the test to pass (**green**)
1. **refactor** (if necessary)

Files:

1. Test - *project/tests/scores/test_scores_api.py*
1. API - *project/api/scores/scores.py*

> Try writing each of these routes (and tests) on your own!

#### <span style="font-family:'Montserrat', 'sans-serif';">GET All Scores</span>

Test:

```python
def test_all_scores(self):
    """Ensure get all scores behaves correctly."""
    add_score(1, 11, True)
    add_score(2, 22, False)
    with self.client:
        response = self.client.get('/scores')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['scores']), 2)
        self.assertEqual(1, data['data']['scores'][0]['user_id'])
        self.assertEqual(2, data['data']['scores'][1]['user_id'])
        self.assertEqual(11, data['data']['scores'][0]['exercise_id'])
        self.assertEqual(22, data['data']['scores'][1]['exercise_id'])
        self.assertTrue(data['data']['scores'][0]['correct'])
        self.assertFalse(data['data']['scores'][1]['correct'])
        self.assertTrue('created_at' in data['data']['scores'][0])
        self.assertTrue('created_at' in data['data']['scores'][1])
        self.assertTrue('updated_at' in data['data']['scores'][0])
        self.assertTrue('updated_at' in data['data']['scores'][1])
        self.assertIn('success', data['status'])
```

Route:

```python
@scores_blueprint.route('/scores', methods=['GET'])
def get_all_scores():
    """Get all scores"""
    scores = Score.query.all()
    scores_list = []
    for score in scores:
        score_object = {
            'id': score.id,
            'user_id': score.user_id,
            'exercise_id': score.exercise_id,
            'correct': score.correct,
            'created_at': score.created_at,
            'updated_at': score.updated_at,
        }
        scores_list.append(score_object)
    response_object = {
        'status': 'success',
        'data': {
            'scores': scores_list
        }
    }
    return jsonify(response_object), 200
```

#### <span style="font-family:'Montserrat', 'sans-serif';">GET Single Score</span>

Tests:

```python
def test_single_score(self):
    """Ensure get single score behaves correctly."""
    score = add_score(88, 99, False)
    with self.client:
        response = self.client.get(f'/scores/{score.id}')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(88, data['data']['user_id'])
        self.assertEqual(99, data['data']['exercise_id'])
        self.assertFalse(data['data']['correct'])
        self.assertTrue('created_at' in data['data'])
        self.assertTrue('updated_at' in data['data'])
        self.assertIn('success', data['status'])

def test_single_score_no_id(self):
    """Ensure error is thrown if an id is not provided."""
    with self.client:
        response = self.client.get('/scores/blah')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 404)
        self.assertIn('Score does not exist', data['message'])
        self.assertIn('fail', data['status'])

def test_single_score_incorrect_id(self):
    """Ensure error is thrown if the id does not exist."""
    with self.client:
        response = self.client.get('/scores/999')
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 404)
        self.assertIn('Score does not exist', data['message'])
        self.assertIn('fail', data['status'])
```

Route:

```python
@scores_blueprint.route('/scores/<score_id>', methods=['GET'])
def get_single_score(score_id):
    """Get single score"""
    response_object = {
        'status': 'fail',
        'message': 'Score does not exist'
    }
    try:
        score = Score.query.filter_by(id=int(score_id)).first()
        if not score:
            return jsonify(response_object), 404
        else:
            response_object = {
                'status': 'success',
                'data': {
                    'id': score.id,
                    'user_id': score.user_id,
                    'exercise_id': score.exercise_id,
                    'correct': score.correct,
                    'created_at': score.created_at,
                    'updated_at': score.updated_at
                }
            }
            return jsonify(response_object), 200
    except ValueError:
        return jsonify(response_object), 404
```

#### <span style="font-family:'Montserrat', 'sans-serif';">GET All Scores By User ID</span>

Tests:

```python
def test_all_scores_by_user_id(self):
    """Ensure get all scores by user id behaves correctly."""
    add_score(998877, 878778, True)
    with self.client:
        response = self.client.get(
            f'/scores/user',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['scores']), 1)
        self.assertEqual(998877, data['data']['scores'][0]['user_id'])
        self.assertEqual(878778, data['data']['scores'][0]['exercise_id'])
        self.assertTrue(data['data']['scores'][0]['correct'])
        self.assertTrue('created_at' in data['data']['scores'][0])
        self.assertTrue('updated_at' in data['data']['scores'][0])
        self.assertIn('success', data['status'])

def test_all_scores_by_user_id_no_scores(self):
    """Ensure get all scores by user id behaves correctly with 0 scores."""
    with self.client:
        response = self.client.get(
            f'/scores/user',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['scores']), 0)
        self.assertIn('success', data['status'])

def test_all_scores_by_user_id_no_header(self):
    """Ensure error is thrown if 'Authorization' header is empty."""
    response = self.client.get(f'/scores/user')
    data = json.loads(response.data.decode())
    self.assertEqual(response.status_code, 403)
    self.assertIn('Provide a valid auth token.', data['message'])
    self.assertIn('error', data['status'])
```

Route:

```python
@scores_blueprint.route('/scores/user', methods=['GET'])
@authenticate
def get_all_scores_by_user_user(resp):
    """Get all scores by user id"""
    scores = Score.query.filter_by(user_id=int(resp['data']['id'])).all()
    scores_list = []
    for score in scores:
        score_object = {
            'id': score.id,
            'user_id': score.user_id,
            'exercise_id': score.exercise_id,
            'correct': score.correct,
            'created_at': score.created_at,
            'updated_at': score.updated_at,
        }
        scores_list.append(score_object)
    response_object = {
        'status': 'success',
        'data': {
            'scores': scores_list
        }
    }
    return jsonify(response_object), 200
```

Update the `ensure_authenticated` function in *project/api/utils.py* as well:

```python
def ensure_authenticated(token):
    if current_app.config['TESTING']:
        test_response = {
            'data': {'id': 998877},
            'status': 'success',
            'admin': True
        }
        return test_response
    url = '{0}/auth/status'.format(current_app.config['USERS_SERVICE_URL'])
    bearer = 'Bearer {0}'.format(token)
    headers = {'Authorization': bearer}
    response = requests.get(url, headers=headers)
    data = json.loads(response.text)
    if response.status_code == 200 and \
       data['status'] == 'success' and \
       data['data']['active']:
        print(data)
        return data
    else:
        return False
```

Instead of returning `True`, we are now returning a test object. So, there's even more test code polluting the source code. Refactor this!

#### <span style="font-family:'Montserrat', 'sans-serif';">GET Single Score By User ID</span>

Tests:

```python
def test_single_score_by_user_id(self):
    """Ensure get all scores by user id behaves correctly."""
    score = add_score(998877, 65479, True)
    with self.client:
        response = self.client.get(
            f'/scores/user/{score.id}',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(998877, data['data']['user_id'])
        self.assertEqual(65479, data['data']['exercise_id'])
        self.assertTrue(data['data']['correct'])
        self.assertTrue('created_at' in data['data'])
        self.assertTrue('updated_at' in data['data'])
        self.assertIn('success', data['status'])

def test_single_score_by_user_id_no_id(self):
    """Ensure error is thrown if an id is not provided."""
    with self.client:
        response = self.client.get(
            '/scores/user/blah',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 404)
        self.assertIn('Score does not exist', data['message'])
        self.assertIn('fail', data['status'])

def test_single_score_incorrect_id(self):
    """Ensure error is thrown if the id does not exist."""
    with self.client:
        response = self.client.get(
            '/scores/user/999',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 404)
        self.assertIn('Score does not exist', data['message'])
        self.assertIn('fail', data['status'])

def test_single_score_by_user_id_no_header(self):
    """Ensure error is thrown if 'Authorization' header is empty."""
    response = self.client.get(f'/scores/user/999')
    data = json.loads(response.data.decode())
    self.assertEqual(response.status_code, 403)
    self.assertIn('Provide a valid auth token.', data['message'])
    self.assertIn('error', data['status'])
```

Route:

```python
@scores_blueprint.route('/scores/user/<score_id>', methods=['GET'])
@authenticate
def get_single_score_by_user_id(resp, score_id):
    """Get single score by user id"""
    response_object = {
        'status': 'fail',
        'message': 'Score does not exist'
    }
    try:
        score = Score.query.filter_by(
            id=int(score_id),
            user_id=int(resp['data']['id'])
        ).first()
        if not score:
            return jsonify(response_object), 404
        else:
            response_object = {
                'status': 'success',
                'data': {
                    'id': score.id,
                    'user_id': score.user_id,
                    'exercise_id': score.exercise_id,
                    'correct': score.correct,
                    'created_at': score.created_at,
                    'updated_at': score.updated_at
                }
            }
            return jsonify(response_object), 200
    except ValueError:
        return jsonify(response_object), 404
```

#### <span style="font-family:'Montserrat', 'sans-serif';">POST</span>

Tests:

```python
def test_add_score(self):
    """Ensure a new score can be added to the database."""
    with self.client:
        response = self.client.post(
            '/scores',
            data=json.dumps(dict(
                exercise_id=86,
                correct=True
            )),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 201)
        self.assertIn('New score was added!', data['message'])
        self.assertIn('success', data['status'])

def test_add_score_invalid_json(self):
    """Ensure error is thrown if the JSON object is empty."""
    with self.client:
        response = self.client.post(
            '/scores',
            data=json.dumps(dict()),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_add_score_invalid_json_keys(self):
    """Ensure error is thrown if the JSON object is invalid."""
    with self.client:
        response = self.client.post(
            '/scores',
            data=json.dumps(dict(correct=True)),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_add_score_duplicate_exercise_id(self):
    """Ensure error is thrown if the exercise already exists."""
    add_score(998877, 65479, True)
    with self.client:
        response = self.client.post(
            '/scores',
            data=json.dumps(dict(
                exercise_id=65479,
                correct=True
            )),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            'Sorry. That score already exists. Please update with a PUT request.',
            data['message'])
        self.assertIn('fail', data['status'])

def test_add_score_no_header(self):
    """Ensure error is thrown if 'Authorization' header is empty."""
    response = self.client.post(
        '/scores',
        data=json.dumps(dict(
            exercise_id=86,
            correct=True
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
@scores_blueprint.route('/scores', methods=['POST'])
@authenticate
def add_score(resp):
    """Add score"""
    auth_user_id = int(resp['data']['id'])
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    exercise_id = post_data.get('exercise_id')
    correct = post_data.get('correct')
    try:
        score = Score.query.filter_by(user_id=int(auth_user_id)).first()
        if not score:
            db.session.add(Score(
                user_id=auth_user_id,
                exercise_id=exercise_id,
                correct=correct))
            db.session.commit()
            response_object = {
                'status': 'success',
                'message': 'New score was added!'
            }
            return jsonify(response_object), 201
        else:
            response_object = {
                'status': 'fail',
                'message': 'Sorry. That score already exists. Please update with a PUT request.'
            }
            return jsonify(response_object), 400
    except (exc.IntegrityError, ValueError) as e:
        db.session().rollback()
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
```

Add the following imports as well:

```python
from sqlalchemy import exc
from project import db
```

#### <span style="font-family:'Montserrat', 'sans-serif';">PUT</span>

Test:

```python
def test_update_score(self):
    """Ensure an existing score can be updated in the database."""
    score = add_score(998877, 65479, True)
    with self.client:
        response = self.client.put(
            f'/scores/{score.id}',
            data=json.dumps(dict(
                exercise_id=65479,
                correct=False
            )),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertIn('Score was updated!', data['message'])
        self.assertIn('success', data['status'])

def test_update_score_invalid_json(self):
    """Ensure error is thrown if the JSON object is empty."""
    with self.client:
        response = self.client.put(
            '/scores/7',
            data=json.dumps(dict()),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_update_score_invalid_json_keys(self):
    """Ensure error is thrown if the JSON object is invalid."""
    with self.client:
        response = self.client.put(
            '/scores/7',
            data=json.dumps(dict(correct=True)),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_update_score_invalid_exercise_id(self):
    """Ensure error is thrown if the exercise does not exist."""
    add_score(998877, 65479, True)
    with self.client:
        response = self.client.put(
            '/scores/9',
            data=json.dumps(dict(
                exercise_id=65479,
                correct=True
            )),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Sorry. That score does not exist.', data['message'])
        self.assertIn('fail', data['status'])

def test_update_score_no_header(self):
    """Ensure error is thrown if 'Authorization' header is empty."""
    response = self.client.put(
        '/scores/9',
        data=json.dumps(dict(
            exercise_id=86,
            correct=True
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
@scores_blueprint.route('/scores/<score_id>', methods=['PUT'])
@authenticate
def update_score(resp, score_id):
    """Update score"""
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    exercise_id = post_data.get('exercise_id')
    correct = post_data.get('correct')
    try:
        score = Score.query.filter_by(
            id=int(score_id),
            exercise_id=int(exercise_id),
            user_id=int(resp['data']['id'])
        ).first()
        if score:
            score.correct = correct
            db.session.commit()
            response_object = {
                'status': 'success',
                'message': 'Score was updated!'
            }
            return jsonify(response_object), 200
        else:
            response_object = {
                'status': 'fail',
                'message': 'Sorry. That score does not exist.'
            }
            return jsonify(response_object), 400
    except (exc.IntegrityError, ValueError, TypeError) as e:
        db.session().rollback()
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
```

#### <span style="font-family:'Montserrat', 'sans-serif';">PATCH</span>

Test:

```python
def test_upsert_score_update(self):
    """Ensure an existing score can be updated in the database."""
    score = add_score(998877, 65479, True)
    with self.client:
        response = self.client.patch(
            f'/scores/{score.id}',
            data=json.dumps(dict(
                exercise_id=65479,
                correct=False
            )),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 200)
        self.assertIn('Score was updated!', data['message'])
        self.assertIn('success', data['status'])

def test_upsert_score_insert(self):
    """Ensure a new score can be added to the database."""
    with self.client:
        response = self.client.patch(
            f'/scores',
            data=json.dumps(dict(
                exercise_id=65479,
                correct=False
            )),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )

        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 201)
        self.assertIn('New score was added!', data['message'])
        self.assertIn('success', data['status'])

def test_upsert_score_invalid_json(self):
    """Ensure error is thrown if the JSON object is empty."""
    with self.client:
        response = self.client.patch(
            '/scores/7',
            data=json.dumps(dict()),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_upsert_score_invalid_json_keys(self):
    """Ensure error is thrown if the JSON object is invalid."""
    with self.client:
        response = self.client.patch(
            '/scores/7',
            data=json.dumps(dict(correct=True)),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('fail', data['status'])

def test_upsert_score_no_header(self):
    """Ensure error is thrown if 'Authorization' header is empty."""
    response = self.client.patch(
        '/scores/9',
        data=json.dumps(dict(
            exercise_id=86,
            correct=True
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
@scores_blueprint.route('/scores', methods=['PATCH'])
@scores_blueprint.route('/scores/<score_id>', methods=['PATCH'])
@authenticate
def upsert_score(resp, score_id=None):
    """Upsert score"""
    auth_user_id = int(resp['data']['id'])
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'fail',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    exercise_id = post_data.get('exercise_id')
    correct = post_data.get('correct')
    try:
        filter_args = {
            'exercise_id': int(exercise_id),
            'user_id': int(resp['data']['id'])
        }
        if score_id:
            filter_args['id'] = int(score_id)

        score = Score.query.filter_by(**filter_args).first()
        if score:
            score.correct = correct
            db.session.commit()
            response_object = {
                'status': 'success',
                'message': 'Score was updated!'
            }
            return jsonify(response_object), 200
        else:
            db.session.add(Score(
                user_id=auth_user_id,
                exercise_id=exercise_id,
                correct=correct))
            db.session.commit()
            response_object = {
                'status': 'success',
                'message': 'New score was added!'
            }
            return jsonify(response_object), 201
    except (exc.IntegrityError, ValueError, TypeError) as e:
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

Have you looked at the test coverage?

```sh
$ docker-compose run eval-service python manage.py cov
```

It should be around 84%:

```sh
Coverage Summary:
Name                           Stmts   Miss Branch BrPart  Cover
----------------------------------------------------------------
project/__init__.py               19      8      0      0    58%
project/api/eval.py                8      0      0      0   100%
project/api/scores/models.py      16     11      0      0    31%
project/api/scores/scores.py     111      1     20      1    98%
project/api/utils.py              33     11      8      2    63%
project/config.py                 19      0      0      0   100%
----------------------------------------------------------------
TOTAL                            196     31     28      3    84%
```

Can you think of any additional tests that should be written? How about routes? What if you wanted to get all scores (and a single score) by exercise id? Write it on your own. Is the code DRY? No! DRY it out! Commit and push your code to GitHub once complete.
