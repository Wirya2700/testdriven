---
title: Code Evaluation
layout: post
date: 2017-10-01 23:59:59
permalink: part-six-code-evaluation
intro: false
part: 6
lesson: 9
share: true
---

In this lesson, we'll set up a RESTful API with AWS Lambda and API Gateway to handle code evaluation...

---

It's a good idea to move long-running processes (like code evaluation) outside of the direct HTTP request/response cycle to improve performance of the web app. This is typically handled by Redis or RabbitMQ along with Celery. We're going to take a different approach with AWS Lambda.

With [AWS Lambda](https://aws.amazon.com/lambda/), we can run scripts without having to provision or manage servers in response to an HTTP POST request.

> For more on AWS Lambda review "What is AWS Lambda?" from [Code Evaluation With AWS Lambda and API Gateway](https://realpython.com/blog/python/code-evaluation-with-aws-lambda-and-api-gateway/).

We'll start by simply setting up an HTTP endpoint with [API Gateway](https://aws.amazon.com/api-gateway/), which is used to trigger the Lambda function. Keep in mind that you would probably want to set up a message queuing service, like Redis or [SQS](https://aws.amazon.com/sqs/), as well. To quickly get up and running we'll skip the message queue... for now...

#### <span style="font-family:'Montserrat', 'sans-serif';">AWS Lambda and API Gateway Setup</span>

Follow the "Lambda Setup" and "API Gateway Setup" sections of the [Code Evaluation With AWS Lambda and API Gateway](https://realpython.com/blog/python/code-evaluation-with-aws-lambda-and-api-gateway/) blog post to quickly get up and running.

You can store the `lambda_handler` function in *flask-microservices-eval/project/lambda/handler.py*:

```python
import sys
from io import StringIO


def lambda_handler(event, context):
    # get code from payload
    code = event['answer']
    test_code = code + '\nprint(sum(1,1))'
    # capture stdout
    buffer = StringIO()
    sys.stdout = buffer
    # execute code
    try:
        exec(test_code)
    except:
        return False
    # return stdout
    sys.stdout = sys.stdout
    # check
    if int(buffer.getvalue()) == 2:
        return True
    return False
```

With that, let's turn our attention to the client-side...

#### <span style="font-family:'Montserrat', 'sans-serif';">Exercise Component</span>

Workflow:

1. User submits solution
1. AJAX request is sent to the API Gateway endpoint
1. On submit, the `Run Code` button is disabled and the grading message appears (so the user knows something is happening in case the process takes more than a few milliseconds)
1. Once the Lambda is complete and the response is received, the grading message disappears and either a correct or incorrect message is displayed
1. Request is sent to the Flask eval service to update the scores

Before we dive in, let's add a test!

##### Test

Set `dev` as the active machine:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```

Set the environment variables:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP:5001
$ export REACT_APP_EVAL_SERVICE_URL=DOCKER_MACHINE_DEV_IP:5002
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
```

Fire up the containers:

```sh
$ docker-compose up -d --build
```

Create the databases:

```sh
$ docker-compose run eval-service python manage.py recreate_db
$ docker-compose run users-service python manage.py recreate_db
```

Apply the seeds:

```sh
$ docker-compose run eval-service python manage.py seed_db
$ docker-compose run users-service python manage.py seed_db
```

Run the full test suite to ensure all is well:

```sh
sh test.sh
```

Then, within "flask-microservices-main/e2e", create a new file called *exercises.test.js*:

```javascript
import { Selector } from 'testcafe';

const randomstring = require('randomstring');

const username = randomstring.generate();
const email = `${username}@test.com`;
const password = 'greaterthanten';

const TEST_URL = process.env.TEST_URL;


fixture('/').page(`${TEST_URL}/`);

test(`should display the exercises correctly if a user is not logged in`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/`)
    .expect(Selector('H1').withText('Exercises').exists).ok()
    .expect(Selector('.alert-warning').withText('Please log in to submit an exercise.').exists).ok()
    .expect(Selector('button').withText('Run Code').exists).notOk()
});

test(`should allow a user to submit an exercise if logged in`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/register`)
    .typeText('input[name="username"]', username)
    .typeText('input[name="email"]', email)
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))
  await t
    .navigateTo(`${TEST_URL}/`)
    .expect(Selector('H1').withText('Exercises').exists).ok()
    .expect(Selector('.alert-warning').withText('Please log in to submit an exercise.').exists).notOk()
    .expect(Selector('button').withText('Run Code').exists).ok()
    .click(Selector('button').withText('Run Code'))
    .expect(Selector('h4').withText('Incorrect!').exists).ok()
});
```

Review the code on your own, and then run the tests again to ensure `should allow a user to submit an exercise if logged in` fails.

##### AJAX request to API Gateway

Update the `url` variable in `submitExercise()`:

```javascript
const url = 'API_GATEWAY_URL'
```

To test, open the JavaScript console in your browser and enter the following code into the Ace code editor:

```python
def sum(num1, num2):
    return num1 + num2
```

The response object should have a key of `data` with a value of `true`.

Update the code to:

```python
def sum(num1, num2):
    return num1
```

Make sure the value of `data` is now `false`.

##### Display grading message

Update the button and add the grading message within the `render()`:

```javascript
{this.props.isAuthenticated &&
  <div>
    <Button
      bsStyle="primary"
      bsSize="small"
      onClick={this.submitExercise.bind(this)}
      disabled={this.state.isDisabled}
    >Run Code</Button>
  {this.state.showGrading &&
    <h4>
      &nbsp;
      <Glyphicon glyph="repeat" className="glyphicon-spin"/>
      &nbsp;
      Grading...
    </h4>
  }
  </div>
}
```

Update the state:

```javascript
this.state = {
  exercises: [],
  aceEditorValue: '# Enter your code here.',
  isDisabled: false,
  showGrading: false
}
```

So, since `isDisabled` defaults to `false` the button will be clickable when the Component is first rendered. The grading message will also not be displayed.

Make sure to update the import, to bring in the [Glyphicon](https://react-bootstrap.github.io/components.html#glyphicons) component:

```javascript
import { Button, Glyphicon } from 'react-bootstrap';
```

Update the `submitExercise` function to change the state of `showGrading` and `isDisabled` to `false`:

```javascript
submitExercise(event) {
  event.preventDefault();
  this.setState({
    showGrading: true,
    isDisabled: true
  });
  const data = {
    answer: this.state.aceEditorValue
  }
  const url = 'API_GATEWAY_URL'
  axios.post(url, data)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  })
}
```

Test it out in the browser!

##### Display correct or incorrect message

Start by adding a few more keys to the state object:

```javascript
this.state = {
  exercises: [],
  aceEditorValue: '# Enter your code here.',
  isDisabled: false,
  showGrading: false,
  showCorrect: false,
  showIncorrect: false
}
```

Then, update the `submitExercise` function to change the state of the appropriate key based on the value of `data`:

```javascript
submitExercise(event) {
  event.preventDefault();
  const stateObject = {
    showGrading: true,
    isDisabled: true,
    showCorrect: false,
    showIncorrect: false
  }
  this.setState(stateObject);
  const data = {
    answer: this.state.aceEditorValue
  }
  const url = 'API_GATEWAY_URL'
  axios.post(url, data)
  .then((res) => {
    stateObject.showGrading = false
    stateObject.isDisabled = false
    if (res.data) {stateObject.showCorrect = true};
    if (!res.data) {stateObject.showIncorrect = true};
    this.setState(stateObject);
  })
  .catch((err) => {
    console.log(err);
    stateObject.showGrading = false
    stateObject.isDisabled = false
    this.setState(stateObject);
  })
}
```

Add a few more messages to the `render()`:

```javascript
{this.state.showCorrect &&
  <h4>
    &nbsp;
    <Glyphicon glyph="ok" className="glyphicon-correct"/>
    &nbsp;
    Correct!
  </h4>
}
{this.state.showIncorrect &&
  <h4>
    &nbsp;
    <Glyphicon glyph="remove" className="glyphicon-incorrect"/>
    &nbsp;
    Incorrect!
  </h4>
}
```

Test it out again!

##### AJAX request to Flask eval service

Add a new method to the `Exercises` component:

```javascript
updateScore(correct) {
  const options = {
    url: `${process.env.REACT_APP_EVAL_SERVICE_URL}/scores`,
    method: 'patch',
    data: {
      exercise_id: this.state.exercises[0].id,
      correct: correct
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${window.localStorage.authToken}`
    }
  };
  return axios(options)
}
```

This will return a promise object, which we can resolve in the `submitExercise` method:

```javascript
submitExercise(event) {
  event.preventDefault();
  const stateObject = {
    showGrading: true,
    isDisabled: true,
    showCorrect: false,
    showIncorrect: false
  }
  this.setState(stateObject);
  const data = {
    answer: this.state.aceEditorValue
  }
  const url = 'API_GATEWAY_URL'
  axios.post(url, data)
  .then((res) => {
    stateObject.showGrading = false
    stateObject.isDisabled = false
    if (res.data) {stateObject.showCorrect = true};
    if (!res.data) {stateObject.showIncorrect = true};
    this.setState(stateObject);
    return this.updateScore(res.data);
  })
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
    stateObject.showGrading = false
    stateObject.isDisabled = false
    this.setState(stateObject);
  })
}
```

Test it out again!

```
$ testcafe chrome e2e

Running tests in:
- Chrome 61.0.3163 / Mac OS X 10.12.0

/all-users
should display the page correctly if a user is not logged in

/
should display the exercises correctly if a user is not logged in
should allow a user to submit an exercise if logged in

/login
should display the sign in form
should validate the password field
should allow a user to sign in
should throw an error if the credentials are incorrect

/register
should display flash messages correctly

/register
should display the registration form
should allow a user to register
should throw an error if the username is taken
should throw an error if the email is taken

/status
should display the page if user is not logged in
should display user info if user is logged in


14 passed (1m 05s)
```
