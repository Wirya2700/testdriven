---
title: React Ace Code Editor
layout: post
date: 2017-09-29 23:59:59
permalink: part-six-react-ace-code-editor
intro: false
part: 6
lesson: 8
share: true
---

In this lesson, we'll add some exercises to the client-side using the Ace code editor plugin...

---

#### <span style="font-family:'Montserrat', 'sans-serif';">Seed Data</span>

Within *flask-microservices-eval*, start by adding a seed command to the *manage.py* file to populate the database with some initial data:

```python
@manager.command
def seed_db():
    """Seeds the database."""
    db.session.add(Exercise(
        exercise_body='Define a function called sum that takes two integers as arguments and returns their sum.',
        test_code='print(sum(2, 3))',
        test_code_solution='5'
    ))
    db.session.add(Exercise(
        exercise_body='Define a function called reverse that takes a string as an argument and returns the string in reversed order.',
        test_code='print(reverse(racecar))',
        test_code_solution='racecar'
    ))
    db.session.add(Exercise(
        exercise_body='Define a function called factorial that takes a random number as an argument and then returns the factorial of that given number.',
        test_code='print(factorial(5))',
        test_code_solution='120'
    ))
    db.session.commit()
```

Set `dev` as the active machine:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```


Set the environment variables:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP:5001
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
```

Fire up the containers:

```sh
$ docker-compose up -d --build
```

Create the database:

```sh
$ docker-compose run eval-service python manage.py recreate_db
```

Apply the seed:

```sh
$ docker-compose run eval-service python manage.py seed_db
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Exercise Component</span>

Next, let's add a new Component to the React app. Within *flask-microservices-client*, add a new class-based component called *Exercises.jsx* to "src/components":

```javascript
import React, { Component } from 'react';

class Exercises extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }
  render() {
    return (
      <div>
        <p>Hello, world!</p>
      </div>
    )
  }
}

export default Exercises
```

Update the main route in *src/App.jsx*:

```javascript
<Route exact path='/' render={() => (
  <Exercises />
)} />
```

Add the import at the top:

```javascript
import Exercises from './components/Exercises';
```

You should see `Hello, world!` in your browser.

Next, let's wire up an AJAX call to grab the exercises from the Flask eval service and render them in the component.

Add a new method to the component:

```javascript
getExercises() {
  axios.get(`${process.env.REACT_APP_EVAL_SERVICE_URL}/exercises`)
  .then((res) => { this.setState({ exercises: res.data.data.exercises }); })
  .catch((err) => { console.log(err); })
}
```

Import axios:

```javascript
import axios from 'axios';
```

And set the environment variable:

```sh
$ export REACT_APP_EVAL_SERVICE_URL=DOCKER_MACHINE_DEV_IP:5002
```

Update the `environment` under the `web-service` in the *docker-compose.yml* file in *flask-microservices-main*:

```yaml
environment:
  - NODE_ENV=development
  - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
  - REACT_APP_EVAL_SERVICE_URL=${REACT_APP_EVAL_SERVICE_URL}
```

Add `exercises` to the state:

```javascript
this.state = {
  exercises: []
}
```

Call `getExercises()` in the `componentDidMount` [Lifecycle](https://reactjs.org/docs/react-component.html#componentdidmount) method:

```javascript
componentDidMount() {
  this.getExercises();
}
```

Finally, update the `render()`:

```javascript
render() {
  return (
    <div>
      <h1>Exercises</h1>
      <hr/><br/>
      {this.state.exercises.length &&
        <div key={this.state.exercises[0].id}>
          <p>{this.state.exercises[0].exercise_body}</p>
        </div>
      }
    </div>
  )
}
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Ace Code Editor</span>

[Ace](https://ace.c9.io/) is an embeddable code editor, which we'll use to allow end users to submit their exercise solutions directly in the browser. We'll use a pre-configured Component for Ace called [React-Ace](https://github.com/securingsincity/react-ace).

Install:

```sh
$ npm install --save react-ace@5.2.1
```

Add the imports:

```javascript
import AceEditor from 'react-ace';
import 'brace/mode/python';
import 'brace/theme/solarized_dark';
```

Update the `render()`:

{% raw %}
```javascript
render() {
  return (
    <div>
      <h1>Exercises</h1>
      <hr/><br/>
        {this.state.exercises.length &&
          <div key={this.state.exercises[0].id}>
            <h4>{this.state.exercises[0].exercise_body}</h4>
              <AceEditor
                mode="python"
                theme="solarized_dark"
                name={(this.state.exercises[0].id).toString()}
                onLoad={this.onLoad}
                fontSize={14}
                height={'175px'}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                value={'# Enter your code here.'}
                style={{
                  marginBottom: '10px'
                }}
              />
            <Button bsStyle="primary" bsSize="small">Run Code</Button>
            <br/><br/>
          </div>
        }
    </div>
  )
}
```
{% endraw %}

Take note of how we created a new instance of the Ace Editor. Experiment with the available [props](https://github.com/securingsincity/react-ace/blob/master/docs/Ace.md#available-props) if you'd like. We also added a Bootstrap-styled button with [React Bootstrap](https://react-bootstrap.github.io/components.html#buttons). Make sure you add the import:

```javascript
import { Button } from 'react-bootstrap';
```

Jump back to the browser. You should see something similar to:

<div style="text-align:left;">
  <img src="/assets/img/react-ace-code-editor.png" style="max-width: 100%; border:0; box-shadow: none;" alt="react ace code editor">
</div>

#### <span style="font-family:'Montserrat', 'sans-serif';">Ensure Authenticated</span>

Next, let's only display the button if a user is logged in:

```javascript
{this.props.isAuthenticated &&
  <Button bsStyle="primary" bsSize="small">Run Code</Button>
}
```

Pass the appropriate prop in by updating the route in *src/App.jsx*:

```javascript
<Route exact path='/' render={() => (
  <Exercises
    isAuthenticated={this.state.isAuthenticated}
  />
)} />
```

Let's also add a message for those not logged in. Update the `render()` method in *src/components/Exercises.jsx*

{% raw %}
```javascript
render() {
  return (
    <div>
      <h1>Exercises</h1>
      <hr/><br/>
        {!this.props.isAuthenticated &&
          <div>
            <div className="alert alert-warning">
              <span
                className="glyphicon glyphicon-exclamation-sign"
                aria-hidden="true">
              </span>
              <span>&nbsp;Please log in to submit an exercise.</span>
            </div>
            <br/>
          </div>
        }
        {this.state.exercises.length &&
          <div key={this.state.exercises[0].id}>
            <h4>{this.state.exercises[0].exercise_body}</h4>
              <AceEditor
                mode="python"
                theme="solarized_dark"
                name={(this.state.exercises[0].id).toString()}
                onLoad={this.onLoad}
                fontSize={14}
                height={'175px'}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                value={'# Enter your code here.'}
                style={{
                  marginBottom: '10px'
                }}
              />
              {this.props.isAuthenticated &&
                <Button bsStyle="primary" bsSize="small">Run Code</Button>
              }
            <br/><br/>
          </div>
        }
    </div>
  )
}
```
{% endraw %}

#### <span style="font-family:'Montserrat', 'sans-serif';">Event Handler</span>

Start by adding the `value` to the state:

```javascript
this.state = {
  exercises: [],
  aceEditorValue: '# Enter your code here.'
}
```

Then, update the `value` property of the `AceEditor`:

```javascript
value={this.state.aceEditorValue}
```

Next, add an `onChange` prop to the `AceEditor` as well:

```javascript
onChange={this.onChange.bind(this)}
```

[onChange](https://github.com/securingsincity/react-ace/blob/master/docs/Ace.md), which is an event used to retrieve the current content of the editor, can be used to fire the following function to update the state:

```javascript
onChange(value) {
  this.setState({ aceEditorValue: value });
}
```

Finally, add an `onClick` handler to the button:

```javascript
{this.props.isAuthenticated &&
  <Button
    bsStyle="primary"
    bsSize="small"
    onClick={this.submitExercise.bind(this)}
  >Run Code</Button>
}
```

Add the `submitExercise` method to the component:

```javascript
submitExercise(event) {
  event.preventDefault();
  const data = {
    answer: this.state.aceEditorValue
  }
  const url = 'tbd'
  axios.post(url, data)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  })
}
```

Re-build the containers to manually test. Commit and push your code to GitHub once done.

---

With that, we need to wire up the actual code evaluation process...
