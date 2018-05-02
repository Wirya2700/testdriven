---
title: React Bootstrap
layout: post
date: 2017-06-16 23:59:59
permalink: part-three-react-bootstrap
intro: false
part: 3
lesson: 7
share: true
---

In this lesson, we'll add a Navbar and a form component with React Bootstrap to set the stage for adding in full auth...

---

Install [React Bootstrap](https://github.com/react-bootstrap/react-bootstrap) and [React Router Boostrap](https://github.com/react-bootstrap/react-router-bootstrap):

```sh
$ npm install --save react-bootstrap@0.31.0
$ npm install --save react-router-bootstrap@0.24.2
```

For each component, we'll roughly follow these steps:

1. Create the component file in "src/components"
1. Add the component
1. Wire up the component to *App.jsx*, passing down any necessary `props`
1. Test it out in the browser

#### <span style="font-family:'Montserrat', 'sans-serif';">Navbar</span>

Create a new file called *NavBar.jsx* in "src/components":

```javascript
import React from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const NavBar = (props) => (
  <Navbar inverse collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <span>{props.title}</span>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <LinkContainer to="/">
          <NavItem eventKey={1}>Home</NavItem>
        </LinkContainer>
        <LinkContainer to="/about">
          <NavItem eventKey={2}>About</NavItem>
        </LinkContainer>
        <LinkContainer to="/status">
          <NavItem eventKey={3}>User Status</NavItem>
        </LinkContainer>
      </Nav>
      <Nav pullRight>
        <LinkContainer to="/register">
          <NavItem eventKey={1}>Register</NavItem>
        </LinkContainer>
        <LinkContainer to="/login">
          <NavItem eventKey={2}>Log In</NavItem>
        </LinkContainer>
        <LinkContainer to="/logout">
          <NavItem eventKey={3}>Log Out</NavItem>
        </LinkContainer>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
)

export default NavBar
```

Then, add the import to *App.jsx*:

```javascript
import NavBar from './components/NavBar';
```

Add a title to `state`:

```javascript
this.state = {
  users: [],
  username: '',
  email: '',
  title: 'TestDriven.io'
}
```

And update `render()`:

```javascript
render() {
  return (
    <div>
      <NavBar
        title={this.state.title}
      />
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
    </div>
  )
}
```

Test it out in the browser before moving on.

#### <span style="font-family:'Montserrat', 'sans-serif';">Form</span>

Instead of using two different components to handle user registration and login, let's create a generic form component and customize it based on the state.

Create a new file called *Form.jsx* in "src/components":

```javascript
import React from 'react';

const Form = (props) => {
  return (
    <div>
      <h1>{props.formType}</h1>
      <hr/><br/>
      <form onSubmit={(event) => props.handleUserFormSubmit(event)}>
        {props.formType === 'Register' &&
          <div className="form-group">
            <input
              name="username"
              className="form-control input-lg"
              type="text"
              placeholder="Enter a username"
              required
              value={props.formData.username}
              onChange={props.handleFormChange}
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
            value={props.formData.email}
            onChange={props.handleFormChange}
          />
        </div>
        <div className="form-group">
          <input
            name="password"
            className="form-control input-lg"
            type="password"
            placeholder="Enter a password"
            required
            value={props.formData.password}
            onChange={props.handleFormChange}
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

export default Form
```

Did you notice the [inline if](https://facebook.github.io/react/docs/conditional-rendering.html#inline-if-with-logical--operator) statement - `props.formType === 'Register' &&`? Review the code above, adding in code comments as needed.

Import the component into *App.jsx*, and then update the state in the constructor:

```javascript
this.state = {
  users: [],
  username: '',
  email: '',
  title: 'TestDriven.io',
  formData: {
    username: '',
    email: '',
    password: ''
  }
}
```

Add the component to the `<Switch>`:

```javascript
<Route exact path='/register' render={() => (
  <Form
    formType={'Register'}
    formData={this.state.formData}
  />
)} />
<Route exact path='/login' render={() => (
  <Form
    formType={'Login'}
    formData={this.state.formData}
  />
)} />
```

Make sure the routes work in the browser, but don't try to submit the forms just yet - we still need to wire them up!

Commit your code.
