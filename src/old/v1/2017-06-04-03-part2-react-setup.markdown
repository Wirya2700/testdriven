---
title: React Setup
layout: post
date: 2017-06-04 23:59:59
permalink: part-two-react-setup
intro: false
part: 2
lesson: 5
share: true
---

Let's turn our attention to the client-side and add [React](https://facebook.github.io/react/)...

---

React is a declarative, component-based, JavaScript library for building user interfaces.

If you're new to React, review the [Quick Start](https://facebook.github.io/react/docs/hello-world.html) and the excellent [Why did we build React?](https://facebook.github.io/react/blog/2013/06/05/why-react.html) blog post. You may also want to step through the [Intro to React](https://github.com/mjhea0/react-intro) tutorial to learn more about Babel and Webpack.

Make sure you have [Node](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/) installed before continuing:

```sh
$ node -v
v7.10.0
$ npm -v
4.2.0
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Project Setup</span>

We'll be using the excellent [Create React App](https://github.com/facebookincubator/create-react-app) tool to generate a boilerplate that's all set up and ready to go.

> Make sure you understand what's happening beneath the scenes with Webpack and babel. For more, check out the [Intro to React](https://github.com/mjhea0/react-intro) tutorial.

Start by installing Create React App globally:

```sh
$ npm install create-react-app@1.3.0 --global
```

Navigate to the *flask-microservices-client* directory and create the boilerplate:

```sh
$ create-react-app .
```

This will also install all dependencies. Once done, start the server:

```sh
$ npm start
```

Now we're ready build our first component!

#### <span style="font-family:'Montserrat', 'sans-serif';">First Component</span>

First, to simplify the structure, remove the *App.css*, *App.js*, *App.test.js*, and *index.css* from the "src" folder, and then update *index.js*:

```javascript
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-4">
          <br/>
          <h1>All Users</h1>
          <hr/><br/>
        </div>
      </div>
    </div>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

What's happening?

1. After importing the `React` and `ReactDom` classes, we created a functional component called `App`, which returns JSX.
1. We then use the `render()` method from `ReactDOM` to mount the App to the DOM into the HTML element with an ID of `root`.

    > Take note of `<div id="root"></div>` within the *index.html* file in the "public" folder.

Add Bootstrap to *index.html* in the `head`:

```html
<link
  href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
  rel="stylesheet"
>
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Class-based Component</span>

Update *index.js*:

```javascript
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class App extends Component {
  constructor() {
    super()
  }
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <br/>
            <h1>All Users</h1>
            <hr/><br/>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

What's happening?

1. We created a class-based component, which runs automatically when an instance is created (behind the scenes).
1. When ran, `super()` calls the constructor of `Component`, which `App` extends from.

You may have already noticed, but the output is the exact same as before.

#### <span style="font-family:'Montserrat', 'sans-serif';">AJAX</span>

To connect the client to the server, add a `getUsers()` method to the `App` class:

```javascript
getUsers() {
  axios.get(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`)
  .then((res) => { console.log(res); })
  .catch((err) => { console.log(err); })
}
```

We'll use [Axios](https://github.com/mzabriskie/axios) to manage the AJAX call:

```sh
$ npm install axios@0.16.2 --save
```

Add the import:

```javascript
import axios from 'axios';
```

You should now have:

```javascript
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

class App extends Component {
  constructor() {
    super()
  }
  getUsers() {
    axios.get(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`)
    .then((res) => { console.log(res); })
    .catch((err) => { console.log(err); })
  }
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <br/>
            <h1>All Users</h1>
            <hr/><br/>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

To connect this to Flask, open a new terminal window, navigate to the *flask-microservices-users*, activate the virtual environment, and set the environment variables:

```sh
$ source env/bin/activate
$ export APP_SETTINGS=project.config.DevelopmentConfig
$ export DATABASE_URL=postgres://postgres:postgres@localhost:5432/users_dev
$ export DATABASE_TEST_URL=postgres://postgres:postgres@localhost:5432/users_test
```

> You may need to change the username and password depending on your local Postgres config.

With your local Postgres server running, create and seed the local database and run the server:

```sh
$ python manage.py recreate_db
$ python manage.py seed_db
$ python manage.py runserver -p 5555
```

Your server should be listening on [http://localhost:5555](http://localhost:5555). Navigate to [http://localhost:5555/users](http://localhost:5555/users) in your browser to test.

Turning back to React, we need to add the [environment variable](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-custom-environment-variables) `process.env.REACT_APP_USERS_SERVICE_URL`. Kill the Create React App server, and then run:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://localhost:5555
```

> All custom environment variables must begin with `REACT_APP_`. For more, check out the [official docs](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-custom-environment-variables).

We still need to call the `getUsers()` method, which we can do in the `constructor()`:

```javascript
constructor() {
  super()
  this.getUsers()
}
```

Run the server - via `npm start` - and then within [Chrome DevTools](https://developer.chrome.com/devtools), open the JavaScript Console. You should see the following error:

```
XMLHttpRequest cannot load http://localhost:5555/users. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://localhost:3000' is therefore not allowed access.
```

In short, we're making a  [cross-origin](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) AJAX request (from `http://localhost:3000` to `http://localhost:5555`), which is a violation of the browsers "same origin policy". Let's use the [Flask-CORS](https://flask-cors.readthedocs.io/en/latest/) extension to handle this.

Within the *flask-microservices-users* project directory, kill the server and then install Flask-CORS:

```sh
(env)$ pip install flask-cors==3.0.2
(env)$ pip freeze > requirements.txt
```

To keep things simple, let's allow cross origin requests on all routes. Simply update `create_app()` in *flask-microservices-users/project/\_\_init\_\_.py* like so:

```python
def create_app():

    # instantiate the app
    app = Flask(__name__)

    # enable CORS
    CORS(app)

    # set config
    app_settings = os.getenv('APP_SETTINGS')
    app.config.from_object(app_settings)

    # set up extensions
    db.init_app(app)

    # register blueprints
    from project.api.views import users_blueprint
    app.register_blueprint(users_blueprint)

    return app
```

Add the import:

```python
from flask_cors import CORS
```

To test, fire back up both servers, open the JavaScript Console again, and this time you should see the results of `console.log(res);`. Let's parse the JSON object:

```javascript
getUsers() {
  axios.get(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`)
  .then((res) => { console.log(res.data.data); })
  .catch((err) => { console.log(err); })
}
```

Now you should have an array with two objects in the JavaScript Console.

Before we move on, we need to do a quick refactor. Remember how we called the `getUsers()` method in the constructor?

```javascript
constructor() {
  super()
  this.getUsers()
}
```

Well, the `constructor()` fires *before* the component is mounted to the DOM. What would happen if the AJAX request took longer than expected and the component was mounted before it was complete? This introduces a [race condition](https://en.wikipedia.org/wiki/Race_condition). Fortunately, React makes it fairly simple to correct this via Lifecycle Methods.

#### <span style="font-family:'Montserrat', 'sans-serif';">Component Lifecycle Methods</span>

Class-based components have several functions available to them that execute at certain times during the life of the component. These are called Lifecycle Methods. Take a quick look at the [official documentation](https://facebook.github.io/react/docs/react-component.html#the-component-lifecycle) to learn about each method and when each is called.

The AJAX call [should happen in the `componentDidMount()` method](https://daveceddia.com/where-fetch-data-componentwillmount-vs-componentdidmount/):

```javascript
componentDidMount() {
  this.getUsers();
}
```

Update the component:

```javascript
class App extends Component {
  constructor() {
    super()
  }
  componentDidMount() {
    this.getUsers();
  }
  getUsers() {
    axios.get(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`)
    .then((res) => { console.log(res.data.data.users); })
    .catch((err) => { console.log(err); })
  }
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <br/>
            <h1>All Users</h1>
            <hr/><br/>
          </div>
        </div>
      </div>
    )
  }
}
```

Make sure everything still works as it did before.

#### <span style="font-family:'Montserrat', 'sans-serif';">State</span>

To add the [state](https://en.wikipedia.org/wiki/State_(computer_science)) - i.e., the users - to the component we need to use `setState()`, which is an asynchronous function use to update state.

Update `getUsers()`:

```javascript
getUsers() {
  axios.get(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`)
  .then((res) => { this.setState({ users: res.data.data.users }); })
  .catch((err) => { console.log(err); })
}
```

Add state to the constructor:

```javascript
constructor() {
  super()
  this.state = {
    users: []
  }
}
```

So, `this.state` adds the state `property` to the class and sets `users` to an empty array.

> Review [Using State Correctly](https://facebook.github.io/react/docs/state-and-lifecycle.html#using-state-correctly) from the official docs.

Finally, update the `render()` method to display the data returned from the AJAX call to the end user:

```javascript
render() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <br/>
          <h1>All Users</h1>
          <hr/><br/>
          {
            this.state.users.map((user) => {
              return <h4 key={user.id} className="well"><strong>{ user.username }</strong> - <em>{user.created_at}</em></h4>
            })
          }
        </div>
      </div>
    </div>
  )
}
```

What's happening?

1. We iterated over the users (from the AJAX request) and created a new H4 element. This is why we needed to set an initial state of an empty array - it prevents `map` from exploding.
1. `key`? - used by React to keep track of each element. Review the [official docs](https://facebook.github.io/react/docs/lists-and-keys.html#keys) for more.

#### <span style="font-family:'Montserrat', 'sans-serif';">Functional Component</span>

Let's create a new component for the users list. Add a new folder called "components" to "src". Add a new file to that folder called *UsersList.jsx*:

```javascript
import React from 'react';

const UsersList = (props) => {
  return (
    <div>
      {
        props.users.map((user) => {
          return (
            <h4
              key={user.id}
              className="well"
            >{user.username}
            </h4>
          )
        })
      }
    </div>
  )
};

export default UsersList;
```

Why did we use a functional component here rather than a class-based component?

Notice how we used `props` instead of `state` in this component. Essentially, you can pass state to a component with either `props` or `state`:

1. Props - data flows down via `props` (from `state` to `props`), read only
1. State - data is tied to a component, read and write

> For more, check out [ReactJS: Props vs. State](http://lucybain.com/blog/2016/react-state-vs-pros/).

It's a good practice to limit the number of class-based (stateful) components since they can manipulate state and are, thus, less predictable. If you just need to render data (like in the above case), then use a functional (state-less) component.

Now we need to pass state from the parent to the child component via `props`. First, add the import to *index.js*:

```javascript
import UsersList from './components/UsersList';
```

Then, update the `render()` method:

```javascript
render() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <br/>
          <h1>All Users</h1>
          <hr/><br/>
            <UsersList users={this.state.users}/>
        </div>
      </div>
    </div>
  )
}
```

Review the code in each component and add comments as necessary. Commit your code.
