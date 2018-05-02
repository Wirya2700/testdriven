---
title: Docker Code Eval
layout: post
date: 2017-09-21 23:59:59
permalink: part-six-docker-code-eval
share: true
---

In this lesson, we'll test-drive the actual code evaluation portion of the new  service....

---

To make development a bit easier, let's build this outside of Docker Compose. Navigate to *flask-microservices-eval*, and then create and active a new virtual environment:

```sh
$ python3.6 -m venv env
$ source env/bin/activate
```

Install the dependencies:

```sh
(env)$ pip install -r requirements.txt
```

To safely run arbitrary, user-supplied code, we'll use the [Docker Python SDK](http://docker-py.readthedocs.io/en/2.5.1/) to create a new container to execute the code in.

Install:

```sh
(env)$ pip install docker==2.5.1
(env)$ pip freeze > requirements.txt
```

Now, let's write some tests!

#### <span style="font-family:'Montserrat', 'sans-serif';">Test 1</span>

*Request*

1. URL: `/eval`
1. HTTP method: `POST`
1. Payload: `{ code: 'print("Hello, World!")' }`

*Response*

```json
{
  "status": "success",
  "output": "Hello, World!"
}
```

Add the following test to the `TestEvalBlueprint` class in *project/tests/test_eval.py*:

```python
def test_eval_endpoint(self):
    """Ensure the /eval route behaves correctly."""
    with self.client:
        response = self.client.post(
            '/eval',
            data=json.dumps(dict(code='print("Hello, World!")')),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'success')
        self.assertTrue(data['output'] == 'Hello, World!')
        self.assertTrue(response.content_type == 'application/json')
        self.assertEqual(response.status_code, 200)
```        

Run the test to ensure it fails:

```sh
(env)$ python manage.py test
```

Then, add the route handler to *project/api/eval.py*:

```python
@eval_blueprint.route('/eval', methods=['POST'])
@authenticate
def eval():
    # get post data
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'error',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    data = post_data.get('code')
    code = io.StringIO(data)
    # execute the code
    try:
        container_name = uuid.uuid4().hex
        create_container(code, container_name)
        output = get_output(container_name)
        return jsonify({
            'status': 'success',
            'output': output.decode('utf-8').rstrip()
        })
    except:
        response_object = {
            'status': 'error',
            'message': 'Something bad happened. Please try again.'
        }
        return jsonify(response_object), 500
```

Essentially, we parse the request object, grabbing the code, and store it in memory with [StringIO](https://docs.python.org/3/library/io.html#io.StringIO). Then, we create a random container name and pass it along with the code to a function called `create_container`. Finally, we get the results from the container via the `get_output` function and send it back to the client.

Create a new file in "project/api" called *docker_service.py*:

```python
import os

from docker import APIClient


client = APIClient(base_url='unix://var/run/docker.sock')


def create_container(code, container_name):
    client.create_container(
        image='python:latest',
        command=['/usr/bin/python', '-c', code.getvalue()],
        volumes=['/opt'],
        host_config=client.create_host_config(
            binds={
                os.getcwd(): {
                    'bind': '/opt',
                    'mode': 'rw',
                }
            }
        ),
        name=container_name,
        working_dir='/opt'
    )
    return True


def get_output(container_name):
    client.start(container_name)
    client.wait(container_name)
    output = client.logs(container_name)
    client.remove_container(container_name, force=True)
    return output
```

First, we create a new instance of the [APIClient](http://docker-py.readthedocs.io/en/2.5.1/api.html), passing in the URL to the local Docker server. Take note of the functions:

  1. The `create_container` function should be fairly straightforward: We simply create a new Docker container from the latest [Python image](https://hub.docker.com/_/python/) and pass in the code to be ran - i.e, `/usr/bin/python -c print('Hello, World!')`.
  1. Within `get_output()`, we [spin](http://docker-py.readthedocs.io/en/2.5.1/api.html#docker.api.container.ContainerApiMixin.start) up the container, [wait](http://docker-py.readthedocs.io/en/2.5.1/api.html#docker.api.container.ContainerApiMixin.wait) for it to stop, grab and return the [logs](http://docker-py.readthedocs.io/en/2.5.1/api.html#docker.api.container.ContainerApiMixin.logs), and [remove](http://docker-py.readthedocs.io/en/2.5.1/api.html#docker.api.container.ContainerApiMixin.remove_container) the container.

Add the import to *project/api/eval.py*:

```python
from project.api.docker_service import create_container, get_output
```

Run the tests. They should pass.

#### <span style="font-family:'Montserrat', 'sans-serif';">Test 2</span>

What if there's a syntax error in the submitted code?

```python
def test_eval_endpoint_handles_syntax_errors(self):
    """Ensure the /eval route returns a syntax error properly."""
    with self.client:
        response = self.client.post(
            '/eval',
            data=json.dumps(dict(code='print("Hello, World! ')),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'success')
        self.assertTrue(data['output'] != 'Hello, World!')
        self.assertIn(
            'SyntaxError: EOL while scanning string literal',
            data['output']
        )
        self.assertTrue(response.content_type == 'application/json')
        self.assertEqual(response.status_code, 200)
```

Run the test. It should already pass!

#### <span style="font-family:'Montserrat', 'sans-serif';">Test 3</span>

What if the end user submits JavaScript rather than Python?

```python
def test_eval_endpoint_handles_name_errors(self):
    """Ensure the /eval route returns a name error properly."""
    with self.client:
        response = self.client.post(
            '/eval',
            data=json.dumps(dict(code='console.log("Hello, World!")')),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertTrue(data['status'] == 'success')
        self.assertTrue(data['output'] != 'Hello, World!')
        self.assertIn(
            "NameError: name 'console' is not defined",
            data['output']
        )
        self.assertTrue(response.content_type == 'application/json')
        self.assertEqual(response.status_code, 200)
```

Again, this should already pass!

#### <span style="font-family:'Montserrat', 'sans-serif';">Test 4</span>

Test:

```python
def test_eval_endpoint_invalid_json(self):
    with self.client:
        response = self.client.post(
            '/eval',
            data=json.dumps(dict()),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('error', data['status'])
```

Does it pass?

#### <span style="font-family:'Montserrat', 'sans-serif';">Test 5</span>

Test:

```python
def test_eval_endpoint_no_code(self):
    with self.client:
        response = self.client.post(
            '/eval',
            data=json.dumps(dict(code='')),
            content_type='application/json',
            headers=dict(Authorization='Bearer test')
        )
        data = json.loads(response.data.decode())
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid payload.', data['message'])
        self.assertIn('error', data['status'])
```

This should fail.

```python
@eval_blueprint.route('/eval', methods=['POST'])
@authenticate
def eval():
    # get post data
    post_data = request.get_json()
    if not post_data:
        response_object = {
            'status': 'error',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    data = post_data.get('code')
    if not data:
        response_object = {
            'status': 'error',
            'message': 'Invalid payload.'
        }
        return jsonify(response_object), 400
    code = io.StringIO(data)
    # execute the code
    try:
        container_name = uuid.uuid4().hex
        create_container(code, container_name)
        output = get_output(container_name)
        return jsonify({
            'status': 'success',
            'output': output.decode('utf-8').rstrip()
        })
    except:
        response_object = {
            'status': 'error',
            'message': 'Something bad happened. Please try again.'
        }
        return jsonify(response_object), 500
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Code Coverage</span>

Where are we at in terms of code coverage?

```sh
(env)$ python manage.py cov
```

Coverage:

```sh
----------------------------------------------------------------------
Ran 10 tests in 4.855s

OK
Coverage Summary:
Name                            Stmts   Miss Branch BrPart  Cover
-----------------------------------------------------------------
project/__init__.py                11      4      0      0    64%
project/api/__init__.py             0      0      0      0   100%
project/api/docker_service.py      12      0      0      0   100%
project/api/eval.py                28      3      4      0    91%
project/api/utils.py               31     10      8      2    64%
project/config.py                  14      0      0      0   100%
-----------------------------------------------------------------
TOTAL                              96     17     12      2    81%
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Check Your Understanding</span>

Add more test cases. Increase the code coverage. Email me your results for a surprise!
