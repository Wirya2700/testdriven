---
title: React Refactor
layout: post
date: 2017-09-27 23:59:59
permalink: part-six-react-refactor
intro: false
part: 6
lesson: 6
share: true
---

In this lesson, we'll shift our attention to the client-side and update a number of React components...

---

> Although we will be updating the end-to-end test suite in the next lesson, challenge yourself to update the test specs *before* changing the code as you go through this lesson.

#### <span style="font-family:'Montserrat', 'sans-serif';">Navbar</span>

Within *flask-microservices-client*, add a new file called *NavBar.css* to "src/components":

```css
.navbar {
  border-radius: 0;
  color: rgba(255,255,255,.5);
}

.navbar-brand {
  color: #777 !important;
}

.navbar-brand:hover {
  cursor: pointer;
  color: #5e5e5e !important;
}
```

Then, update *NavBar.jsx*:

```javascript
import React from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import './NavBar.css';

const NavBar = (props) => (
  <Navbar collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <LinkContainer to="/">
          <span>{props.title}</span>
        </LinkContainer>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <LinkContainer to="/about">
          <NavItem>About</NavItem>
        </LinkContainer>
        {props.isAuthenticated &&
          <LinkContainer to="/status">
            <NavItem>User Status</NavItem>
          </LinkContainer>
        }
      </Nav>
      <Nav pullRight>
        {!props.isAuthenticated &&
          <LinkContainer to="/register">
            <NavItem>Register</NavItem>
          </LinkContainer>
        }
        {!props.isAuthenticated &&
          <LinkContainer to="/login">
            <NavItem>Log In</NavItem>
          </LinkContainer>
        }
        {props.isAuthenticated &&
          <LinkContainer to="/logout">
            <NavItem>Log Out</NavItem>
          </LinkContainer>
        }
      </Nav>
    </Navbar.Collapse>
  </Navbar>
)

export default NavBar
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Footer</span>

Add a new file to "src/components" called *Footer.jsx*:

```javascript
import React from 'react';

import './Footer.css';

const Footer = (props) => (
  <footer className="footer">
    <div className="container">
      <small className="text-muted">
        <span>Copyright 2017 <a href="http://testdriven.io">TestDriven.io</a>.</span>
      </small>
    </div>
  </footer>
)

export default Footer
```

Create a *Footer.css* file as well:

```css
.footer {
  bottom: 0;
  width: 100%;
  height: 50px;
  line-height: 50px;
  margin-top: 50px;
}
```

Add the import to *App.jsx*:

```javascript
import Footer from './components/Footer'
```

Then, add the component in the `render()`, just before the closing `div`:

```javascript
<Footer/>
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Custom Font</span>

Let's add the [Roboto](https://fonts.google.com/specimen/Roboto) font. First, add the stylesheet to the `head` in *index.html*, just below the Bootstrap stylesheet:

```html
<link href="//fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
```

To apply the font, create a new file called *main.css* in the "public" directory:

```css
html, body {
  font-family: 'Roboto', sans-serif !important;
}
```

Again, add the stylesheet to the *index.html* file, below the Roboto stylesheet:

```html
<link rel="stylesheet" href="main.css">
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Forms</span>

You may already have noticed, but the login form probably does not need the same validation rules applied to it that the register form has. Let's break them apart.

Create a new file in "src/components" called "forms", and add the following files:

1. *RegisterForm.jsx*
1. *LoginForm.jsx*

Move the *FormErrors.jsx* and *FormErrors.css* files to "forms" as well. Make sure to remove the *Form.jsx* file.

##### Register

```javascript
import React, { Component } from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';

import FormErrors from './FormErrors'

class RegisterForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        username: '',
        email: '',
        password: ''
      },
      formRules: [
        {
          id: 1,
          field: 'username',
          name: 'Username must be greater than 5 characters.',
          valid: false
        },
        {
          id: 2,
          field: 'email',
          name: 'Email must be greater than 5 characters.',
          valid: false
        },
        {
          id: 3,
          field: 'email',
          name: 'Email must be a valid email address.',
          valid: false
        },
        {
          id: 4,
          field: 'password',
          name: 'Password must be greater than 10 characters.',
          valid: false
        }
      ],
      valid: false
    }
    this.handleRegisterFormSubmit = this.handleRegisterFormSubmit.bind(this);
  }
  componentDidMount() {
    this.clearForm();
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.formType !== nextProps.formType) {
      this.clearForm();
      this.initRules();
    }
  }
  clearForm() {
    this.setState({
      formData: {username: '', email: '', password: ''}
    });
  }
  initRules() {
    const rules = this.state.formRules;
    for (const rule of rules) {
      rule.valid = false;
    }
    this.setState({formRules: rules})
  }
  handleFormChange(event) {
    const obj = this.state.formData;
    obj[event.target.name] = event.target.value;
    this.setState(obj);
    this.validateForm()
  }
  allTrue() {
    for (const rule of this.state.formRules) {
      if (!rule.valid) return false;
    }
    return true;
  }
  validateForm() {
    const rules = this.state.formRules;
    const formData = this.state.formData;
    this.setState({valid: false});
    for (const rule of rules) {
      rule.valid = false;
    }
    if (formData.username.length > 5) rules[0].valid = true;
    if (formData.email.length > 5) rules[1].valid = true;
    if (this.validateEmail(formData.email)) rules[2].valid = true;
    if (formData.password.length > 10) rules[3].valid = true;
    this.setState({formRules: rules})
    if (this.allTrue()) this.setState({valid: true});
  }
  validateEmail(email) {
    // eslint-disable-next-line
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }
  handleRegisterFormSubmit(event) {
    event.preventDefault();
    const data = {
      username: this.state.formData.username,
      email: this.state.formData.email,
      password: this.state.formData.password
    }
    const url = `${process.env.REACT_APP_USERS_SERVICE_URL}/auth/register`
    axios.post(url, data)
    .then((res) => {
      this.clearForm();
      this.props.loginUser(res.data.auth_token);
    })
    .catch((err) => {
      this.props.createMessage('That user already exists.', 'danger')
    })
  }
  render() {
    if (this.props.isAuthenticated) {
      return <Redirect to='/' />;
    }
    return (
      <div>
        <h1>Register</h1>
        <hr/><br/>
        <FormErrors
          formRules={this.state.formRules}
        />
        <form onSubmit={(event) => this.handleRegisterFormSubmit(event)}>
          <div className="form-group">
            <input
              name="username"
              className="form-control input-md"
              type="text"
              placeholder="Enter a username"
              required
              value={this.state.formData.username}
              onChange={this.handleFormChange.bind(this)}
            />
          </div>
          <div className="form-group">
            <input
              name="email"
              className="form-control input-md"
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
              className="form-control input-md"
              type="password"
              placeholder="Enter a password"
              required
              value={this.state.formData.password}
              onChange={this.handleFormChange.bind(this)}
            />
          </div>
          <input
            type="submit"
            className="btn btn-primary btn-md"
            value="Submit"
            disabled={!this.state.valid}
          />
        </form>
      </div>
    )
  }
}

export default RegisterForm
```

##### Login

```javascript
import React, { Component } from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';

import FormErrors from './FormErrors'

class LoginForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        email: '',
        password: ''
      },
      formRules: [
        {
          id: 1,
          field: 'email',
          name: 'Email is required.',
          valid: false
        },
        {
          id: 2,
          field: 'password',
          name: 'Password is required.',
          valid: false
        }
      ],
      valid: false
    }
    this.handleLoginFormSubmit = this.handleLoginFormSubmit.bind(this);
  }
  componentDidMount() {
    this.clearForm();
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.formType !== nextProps.formType) {
      this.clearForm();
      this.initRules();
    }
  }
  clearForm() {
    this.setState({
      formData: {email: '', password: ''}
    });
  }
  initRules() {
    const rules = this.state.formRules;
    for (const rule of rules) {
      rule.valid = false;
    }
    this.setState({formRules: rules})
  }
  handleFormChange(event) {
    const obj = this.state.formData;
    obj[event.target.name] = event.target.value;
    this.setState(obj);
    this.validateForm()
  }
  allTrue() {
    for (const rule of this.state.formRules) {
      if (!rule.valid) return false;
    }
    return true;
  }
  validateForm() {
    const rules = this.state.formRules;
    const formData = this.state.formData;
    this.setState({valid: false});
    for (const rule of rules) {
      rule.valid = false;
    }
    if (formData.email.length > 0) rules[0].valid = true;
    if (formData.password.length > 0) rules[1].valid = true;
    this.setState({formRules: rules})
    if (this.allTrue()) this.setState({valid: true});
  }
  handleLoginFormSubmit(event) {
    event.preventDefault();
    const data = {
      username: this.state.formData.username,
      email: this.state.formData.email,
      password: this.state.formData.password
    }
    const url = `${process.env.REACT_APP_USERS_SERVICE_URL}/auth/login`
    axios.post(url, data)
    .then((res) => {
      this.clearForm();
      this.props.loginUser(res.data.auth_token);
    })
    .catch((err) => {
      this.props.createMessage('User does not exist.', 'danger')
    })
  }
  render() {
    if (this.props.isAuthenticated) {
      return <Redirect to='/' />;
    }
    return (
      <div>
        <h1>Login</h1>
        <hr/><br/>
        <FormErrors
          formRules={this.state.formRules}
        />
        <form onSubmit={(event) => this.handleLoginFormSubmit(event)}>
          <div className="form-group">
            <input
              name="email"
              className="form-control input-md"
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
              className="form-control input-md"
              type="password"
              placeholder="Enter a password"
              required
              value={this.state.formData.password}
              onChange={this.handleFormChange.bind(this)}
            />
          </div>
          <input
            type="submit"
            className="btn btn-primary btn-md"
            value="Submit"
            disabled={!this.state.valid}
          />
        </form>
      </div>
    )
  }
}

export default LoginForm
```

##### Errors

```javascript
import React from 'react';

import './FormErrors.css';

const FormErrors = (props) => {
  return (
    <div>
      <ul className="validation-list">
        {
          props.formRules.map((rule) => {
            return <li
              className={rule.valid ? "success" : "error"} key={rule.id}>{rule.name}
            </li>
          })
        }
      </ul>
    </div>
  )
}

export default FormErrors;
```

##### App

Add the following imports:

```javascript
import RegisterForm from './components/forms/RegisterForm';
import LoginForm from './components/forms/LoginForm';
```

Make sure to remove the Form import:

```javascript
import Form from './components/Form';
```

Finally, update the following routes in the `render()`:

```javascript
<Route exact path='/register' render={() => (
  <RegisterForm
    isAuthenticated={this.state.isAuthenticated}
    loginUser={this.loginUser.bind(this)}
    createMessage={this.createMessage.bind(this)}
  />
)} />
<Route exact path='/login' render={() => (
  <LoginForm
    isAuthenticated={this.state.isAuthenticated}
    loginUser={this.loginUser.bind(this)}
    createMessage={this.createMessage.bind(this)}
  />
)} />
```

Take note of what changed in each of these files. How would you DRY out the forms to remove the duplicate methods?

#### <span style="font-family:'Montserrat', 'sans-serif';">Users</span>

Next, let's move the `UsersList` component to a new route. Within the `render()` in *src/App.jsx*, update the main route to:

```javascript
<Route exact path='/' render={() => (
  <p>Something.</p>
)} />
```

Then, create a new route for the  `UsersList` component:

```javascript
<Route exact path='/all-users' render={() => (
  <UsersList
    users={this.state.users}
  />
)} />
```

Finally, add a new link just below the `/about` link in *src/components/NavBar.jsx*:

```javascript
<LinkContainer to="/all-users">
  <NavItem>Users</NavItem>
</LinkContainer>
```

---

Commit and push your code.
