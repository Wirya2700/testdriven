---
title: React Component Refactor
layout: post
date: 2017-06-25 23:59:59
permalink: part-four-react-component-refactor
intro: false
part: 4
lesson: 4
share: true
---

In this lesson, we'll convert a stateless, functional component to a stateful, class-based component...

---

Before jumping into validation, let's refactor the `Form` component into a class-based component, so state can be managed in the component itself.

Update *src/components/Form.jsx* like so:

```javascript
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

class Form extends Component {
  constructor (props) {
    super(props)
  }
  render() {
    if (this.props.isAuthenticated) {
      return <Redirect to='/' />;
    }
    return (
      <div>
        <h1>{this.props.formType}</h1>
        <hr/><br/>
        <form onSubmit={(event) => this.props.handleUserFormSubmit(event)}>
          {this.props.formType === 'Register' &&
            <div className="form-group">
              <input
                name="username"
                className="form-control input-lg"
                type="text"
                placeholder="Enter a username"
                required
                value={this.props.formData.username}
                onChange={this.props.handleFormChange}
              />
            </div>
          }
          <div className="form-group">
            <input
              name="email"
              className="form-control input-lg"
              type="email"
              placeholder="Enter an email address"
              required
              value={this.props.formData.email}
              onChange={this.props.handleFormChange}
            />
          </div>
          <div className="form-group">
            <input
              name="password"
              className="form-control input-lg"
              type="password"
              placeholder="Enter a password"
              required
              value={this.props.formData.password}
              onChange={this.props.handleFormChange}
            />
          </div>
          <input
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            value="Submit"
          />
        </form>
      </div>
    )
  }
}

export default Form
```

Update the containers:

```sh
$ docker-compose up -d --build
```

And then run the tests to ensure we didn't break anything.

Now, instead of passing everything down via the props, we can manage the state of the component within the component itself.

Again, update *src/components/Form.jsx*:

{% raw %}
```javascript
import React, { Component } from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';

class Form extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        username: '',
        email: '',
        password: ''
      }
    }
    this.handleUserFormSubmit = this.handleUserFormSubmit.bind(this);
  }
  componentDidMount() {
    this.clearForm();
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.formType !== nextProps.formType) {
      this.clearForm();
    }
  }
  clearForm() {
    this.setState({
      formData: {username: '', email: '', password: ''}
    });
  }
  handleFormChange(event) {
    const obj = this.state.formData;
    obj[event.target.name] = event.target.value;
    this.setState(obj);
  }
  handleUserFormSubmit(event) {
    event.preventDefault();
    const formType = this.props.formType
    let data;
    if (formType === 'login') {
      data = {
        email: this.state.formData.email,
        password: this.state.formData.password
      }
    }
    if (formType === 'register') {
      data = {
        username: this.state.formData.username,
        email: this.state.formData.email,
        password: this.state.formData.password
      }
    }
    const url = `${process.env.REACT_APP_USERS_SERVICE_URL}/auth/${formType}`
    axios.post(url, data)
    .then((res) => {
      this.clearForm();
      this.props.loginUser(res.data.auth_token);
    })
    .catch((err) => { console.log(err); })
  }
  render() {
    if (this.props.isAuthenticated) {
      return <Redirect to='/' />;
    }
    return (
      <div>
        <h1 style={{'textTransform':'capitalize'}}>{this.props.formType}</h1>
        <hr/><br/>
        <form onSubmit={(event) => this.handleUserFormSubmit(event)}>
          {this.props.formType === 'register' &&
            <div className="form-group">
              <input
                name="username"
                className="form-control input-lg"
                type="text"
                placeholder="Enter a username"
                required
                value={this.state.formData.username}
                onChange={this.handleFormChange.bind(this)}
              />
            </div>
          }
          <div className="form-group">
            <input
              name="email"
              className="form-control input-lg"
              type="email"
              placeholder="Enter an email address"
              required
              value={this.state.formData.email}
              onChange={this.handleFormChange.bind(this)}
            />
          </div>
          <div className="form-group">
            <input
              name="password"
              className="form-control input-lg"
              type="password"
              placeholder="Enter a password"
              required
              value={this.state.formData.password}
              onChange={this.handleFormChange.bind(this)}
            />
          </div>
          <input
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            value="Submit"
          />
        </form>
      </div>
    )
  }
}

export default Form
```
{% endraw %}

Then update *src/App.jsx*:

```javascript
import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom'
import axios from 'axios';

import UsersList from './components/UsersList';
import About from './components/About';
import NavBar from './components/NavBar';
import Form from './components/Form';
import Logout from './components/Logout';
import UserStatus from './components/UserStatus';

class App extends Component {
  constructor() {
    super()
    this.state = {
      users: [],
      title: 'TestDriven.io',
      isAuthenticated: false
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
  logoutUser() {
    window.localStorage.clear();
    this.setState({ isAuthenticated: false });
  }
  loginUser(token) {
    window.localStorage.setItem('authToken', token);
    this.setState({ isAuthenticated: true });
    this.getUsers();
  }
  render() {
    return (
      <div>
        <NavBar
          title={this.state.title}
          isAuthenticated={this.state.isAuthenticated}
        />
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <br/>
              <Switch>
                <Route exact path='/' render={() => (
                  <UsersList
                    users={this.state.users}
                  />
                )} />
                <Route exact path='/about' component={About}/>
                <Route exact path='/register' render={() => (
                  <Form
                    formType={'register'}
                    isAuthenticated={this.state.isAuthenticated}
                    loginUser={this.loginUser.bind(this)}
                  />
                )} />
                <Route exact path='/login' render={() => (
                  <Form
                    formType={'login'}
                    isAuthenticated={this.state.isAuthenticated}
                    loginUser={this.loginUser.bind(this)}
                  />
                )} />
                <Route exact path='/logout' render={() => (
                  <Logout
                    logoutUser={this.logoutUser.bind(this)}
                    isAuthenticated={this.state.isAuthenticated}
                  />
                )} />
                <Route exact path='/status' render={() => (
                  <UserStatus
                    isAuthenticated={this.state.isAuthenticated}
                  />
                )} />
              </Switch>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App
```

Review the changes. Notice anything new? There's a number of changes, but really the only thing that you have not seen before is the use of the `componentWillReceiveProps` [Lifecycle Method](https://facebook.github.io/react/docs/react-component.html#the-component-lifecycle):

```javascript
componentWillReceiveProps(nextProps) {
  if (this.props.formType !== nextProps.formType) {
    this.clearForm();
  }
}
```

This method is called *after* the initial rendering and *before* a component receives new props. So, if you have a change in props, not on the initial render, then this method will fire.

Remember: We are sharing state for both signing up and logging in. This can cause problems with form validation on a route change - i.e., `/login` to `/register` - if the state is not cleared out. In other words, if an end user fills out the login form, and it validates correctly, and for whatever reason does not submit the form but instead navigates to `/register`, the registration form will automatically be valid. To prevent that from happening, `componentWillReceiveProps()` fires on the route change, clearing the form.

It's important to note that this method can be called by React for strange reasons, at odd times. For that reason, you should *always* compare the current (`this.props.formType`) and next prop values (`nextProps.formType`) if you only want to do something based on a prop change.

With that, update the containers and run the tests:

```sh
$ docker-compose up -d --build
$ testcafe chrome e2e
```
