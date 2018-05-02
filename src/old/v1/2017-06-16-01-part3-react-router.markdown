---
title: React Router
layout: post
date: 2017-06-16 23:59:59
permalink: part-three-react-router
intro: false
part: 3
lesson: 6
share: true
---

In this lesson, we'll wire up routing in our React App to manage navigation between different components so the end user has unique pages to interact with...

---

Let's add an `/about` route!

At this point, you should already be quite familiar with the concept of routing on the server-side. Well, client-side routing is the really the same - it's just run in the browser. For more on this, review the excellent [Deep dive into client-side routing](http://krasimirtsonev.com/blog/article/deep-dive-into-client-side-routing-navigo-pushstate-hash) article.

> Keep in mind that React Router is only necessary for apps that have more than one page.



In the terminal, open *flask-microservices-client* and then install [react-router-dom](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-dom):

```sh
$ npm install --save react-router-dom@4.1.1
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Check Your Understanding</span>

> This part is optional but highly recommended.

Put your skills to test!

1. Start a new React App on your own with Create React App in a new project directory.
1. Add two components - `Home` and `Contact`. These should be functional components that just display an `<h2>` element with the name of the component.
1. Follow the official [Quick Start](https://reacttraining.com/react-router/web/guides/quick-start) guide to add react-router-dom to your app.

#### <span style="font-family:'Montserrat', 'sans-serif';">Refactor</span>

Before adding the Router, let's move the `App` component out of *index.js* to clean things up. Add an *App.jsx* file to the "src" directory, and then update both files...

*App.jsx*:

```javascript
import React, { Component } from 'react';
import axios from 'axios';

import UsersList from './components/UsersList';
import AddUser from './components/AddUser';

class App extends Component {
  constructor() {
    super()
    this.state = {
      users: [],
      username: '',
      email: ''
    }
  }
  componentDidMount() {
    this.getUsers();
  }
  getUsers() {
    axios.get(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`)
    .then((res) => { this.setState({ users: res.data.data.users }); })
    .catch((err) => { console.log(err); })
  }
  addUser(event) {
    event.preventDefault();
    const data = {
      username: this.state.username,
      email: this.state.email
    }
    axios.post(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`, data)
    .then((res) => {
      this.getUsers();
      this.setState({ username: '', email: '' });
    })
    .catch((err) => { console.log(err); })
  }
  handleChange(event) {
    const obj = {};
    obj[event.target.name] = event.target.value;
    this.setState(obj);
  }
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <br/>
            <h1>All Users</h1>
            <hr/><br/>
            <AddUser
              username={this.state.username}
              email={this.state.email}
              handleChange={this.handleChange.bind(this)}
              addUser={this.addUser.bind(this)}
            />
            <br/>
            <UsersList users={this.state.users}/>
          </div>
        </div>
      </div>
    )
  }
}

export default App
```

*index.js*:

```javascript
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App.jsx';

ReactDOM.render(
  <App/>,
  document.getElementById('root')
)
```

To test locally, open a new terminal window to *flask-microservices-users*, activate a virtual environment, and then run the Flask server:

```sh
(env)$ python manage.py runserver
```

And then set the environment variable back in *flask-microservices-client* and run the React app:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1:5000
$ npm start
```

Make sure all is well!

#### <span style="font-family:'Montserrat', 'sans-serif';">Router Setup</span>

Let's start with a basic `/about` route.

[React Router](https://github.com/ReactTraining/react-router) has two main components:

1. `Router`: keeps your UI and URL in sync
1. `Route`: maps a route to a component

> We'll be using the `BrowserRouter` for routing, which uses the [HTML 5 History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API). Review the [docs](https://reacttraining.com/react-router/web/api/BrowserRouter) for more info.

Add the router to *index.js*:

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom'

import App from './App.jsx';

ReactDOM.render((
  <Router>
    <App />
  </Router>
), document.getElementById('root'))
```

Let's add a new component to use for the route. Add a new file called *About.jsx* to "components":

```javascript
import React from 'react';

const About = () => (
  <div>
    <h1>About</h1>
    <hr/><br/>
    <p>Add something relevant here.</p>
  </div>
)

export default About;
```

To get a quick sanity check, import the component into *App.jsx*:

```javascript
import About from './components/About';
```

Then add the component to the `render` method, just below the `UsersList` component:

```javascript
...
<UsersList users={this.state.users}/>
<About/>
...
```

Make sure you can see the HTML in the browser.

Now, to render the `About` component in a different route, update the `render` method again:

```javascript
render() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <br/>
          <Switch>
            <Route exact path='/' render={() => (
              <div>
                <h1>All Users</h1>
                <hr/><br/>
                <AddUser
                  username={this.state.username}
                  email={this.state.email}
                  handleChange={this.handleChange.bind(this)}
                  addUser={this.addUser.bind(this)}
                />
                <br/>
                <UsersList users={this.state.users}/>
              </div>
            )} />
            <Route exact path='/about' component={About}/>
          </Switch>
        </div>
      </div>
    </div>
  )
}
```

Here, we used the `<Switch>` component to group `<Route>`s and then defined two routes - `/` and `/about`.

> Make sure to review the official documentation on the [Switch](https://reacttraining.com/react-router/web/api/Switch) component.


Don't forget the import:

```javascript
import { Route, Switch } from 'react-router-dom'
```

Save, and then test each route in the browser. Once done, commit and push your code.
