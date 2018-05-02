---
title: React Bootstrap
layout: post
permalink: part-three-react-bootstrap
intro: false
part: 3
lesson: 7
share: true
---

In this lesson, we'll add a Navbar and a form component with React Bootstrap to set the stage for adding in full auth...

---

### Setup

Add [React Bootstrap](https://github.com/react-bootstrap/react-bootstrap) and [React Router Boostrap](https://github.com/react-bootstrap/react-router-bootstrap) to the *package.json* file:

```
"dependencies": {
  "axios": "^0.16.2",
  "react": "^16.0.0",
  "react-bootstrap": "^0.31.5",
  "react-dom": "^16.0.0",
  "react-router-bootstrap": "^0.24.4",
  "react-router-dom": "^4.2.2",
  "react-scripts": "1.0.14"
},
```

For each component, we'll roughly follow these steps:

1. Write a unit test
1. Run the test to ensure it fails
1. Create the component file
1. Add the component
1. Wire up the component to *App.jsx*, passing down any necessary `props`
1. Manually test it in the browser
1. Ensure the unit tests pass
1. Write a snapshot test

### Navbar

Create two new files in "src/components":

1. *NavBar.test.js*
1. *NavBar.jsx*

Start with some tests:

```javascript
import React from 'react';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import NavBar from './NavBar';

const title = 'Hello, World!';

test('NavBar renders properly', () => {
  const wrapper = shallow(<NavBar title={title}/>);
  const element = wrapper.find('span');
  expect(element.length).toBe(1);
  expect(element.get(0).props.children).toBe(title);
});
```

Ensure it fails, and then add the component:

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

export default NavBar;
```

Add the import to *App.jsx*:

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
                    handleChange={this.handleChange}
                    addUser={this.addUser}
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
};
```

Update the container:

```sh
$ docker-compose -f docker-compose-dev.yml up -d --build
```

Test it out in the browser.

<div style="text-align:left;">
  <img src="/assets/img/course/03_react_bootstrap_navbar.png" style="max-width: 100%; border:0; box-shadow: none;" alt="react bootstrap navbar">
</div>

Ensure the tests pass. Then, add a snapshot test:

```javascript
test('NavBar renders a snapshot properly', () => {
  const tree = renderer.create(
    <Router location="/"><NavBar title={title}/></Router>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

Add the import:

```javascript
import { MemoryRouter as Router } from 'react-router-dom';
```

Here, we used the [MemoryRouter](https://reacttraining.com/react-router/core/api/MemoryRouter) to provide context to the Router for the test.

> Review the official [Testing guide](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/testing.md) for more info.

### Form

Instead of using two different components to handle user registration and login, let's create a generic form component and customize it based on the state.

Add the files:

1. *Form.test.js*
1. *Form.jsx*

Test:

```javascript
import React from 'react';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import Form from './Form';

const formData = {
  username: '',
  email: '',
  password: ''
};

test('Register Form renders properly', () => {
  const component = <Form formType={'Register'} formData={formData} />;
  const wrapper = shallow(component);
  const h1 = wrapper.find('h1');
  expect(h1.length).toBe(1);
  expect(h1.get(0).props.children).toBe('Register');
  const formGroup = wrapper.find('.form-group');
  expect(formGroup.length).toBe(3);
  expect(formGroup.get(0).props.children.props.name).toBe('username');
  expect(formGroup.get(0).props.children.props.value).toBe('');
});

test('Login Form renders properly', () => {
  const component = <Form formType={'Login'} formData={formData} />;
  const wrapper = shallow(component);
  const h1 = wrapper.find('h1');
  expect(h1.length).toBe(1);
  expect(h1.get(0).props.children).toBe('Login');
  const formGroup = wrapper.find('.form-group');
  expect(formGroup.length).toBe(2);
  expect(formGroup.get(0).props.children.props.name).toBe('email');
  expect(formGroup.get(0).props.children.props.value).toBe('');
});
```

Component:

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
};

export default Form;
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
};
```

Add the component to the `<Switch>`, within the `render`:

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

Add the snapshot tests:

```javascript
test('Register Form renders a snapshot properly', () => {
  const component = <Form formType={'Register'} formData={formData} />;
  const tree = renderer.create(component).toJSON();
  expect(tree).toMatchSnapshot();
});

test('Login Form renders a snapshot properly', () => {
  const component = <Form formType={'Login'} formData={formData} />;
  const tree = renderer.create(component).toJSON();
  expect(tree).toMatchSnapshot();
});
```

Make sure the tests pass!

```sh
PASS  src/components/Form.test.js
PASS  src/components/NavBar.test.js
PASS  src/App.test.js
PASS  src/components/About.test.js
PASS  src/components/UsersList.test.js
PASS  src/components/AddUser.test.js

Test Suites: 6 passed, 6 total
Tests:       13 passed, 13 total
Snapshots:   6 passed, 6 total
Time:        2.761s, estimated 7s
Ran all test suites.
```

### Refactor

Before moving on, let's do two quick refactors...

#### Form tests

This code is not DRY. It may be fine for the two forms we have now, but what if we had 20? Re-write this on your own before reviewing the solution.

```javascript
import React from 'react';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import Form from './Form';

const testData = [
  {
    formType: 'Register',
    formData: {
      username: '',
      email: '',
      password: ''
    },
  },
  {
    formType: 'Login',
    formData: {
      email: '',
      password: ''
    },
  }
]

testData.forEach((el) => {
  test(`${el.formType} Form renders properly`, () => {
    const component = <Form formType={el.formType} formData={el.formData} />;
    const wrapper = shallow(component);
    const h1 = wrapper.find('h1');
    expect(h1.length).toBe(1);
    expect(h1.get(0).props.children).toBe(el.formType);
    const formGroup = wrapper.find('.form-group');
    expect(formGroup.length).toBe(Object.keys(el.formData).length);
    expect(formGroup.get(0).props.children.props.name).toBe(Object.keys(el.formData)[0]);
    expect(formGroup.get(0).props.children.props.value).toBe('');
  });
  test(`${el.formType} Form renders a snapshot properly`, () => {
    const component = <Form formType={el.formType} formData={el.formData} />;
    const tree = renderer.create(component).toJSON();
    expect(tree).toMatchSnapshot();
  });
})
```

Run the tests again.

```sh
PASS  src/components/Form.test.js
PASS  src/components/NavBar.test.js
PASS  src/App.test.js
PASS  src/components/About.test.js
PASS  src/components/UsersList.test.js
PASS  src/components/AddUser.test.js

Test Suites: 6 passed, 6 total
Tests:       13 passed, 13 total
Snapshots:   6 passed, 6 total
Time:        3.118s, estimated 7s
Ran all test suites.
```

Also, it's important to ensure that the rendered components have not actually changed. Start by visually inspecting them in the browser, and then, as long as the two snapshots pass without having to create new snapshots, then we know all is well. How do you know if the snapshot has changed?

You'll see the following message in the terminal when the tests run:


```sh
Snapshot Summary
 › 1 snapshot written in 1 test suite.
 › 1 obsolete snapshot found, press `u` to remove them.
```

If you see that message, immediately revert your code back, take a new snapshot, and then start the refactor over again.

#### Test directory

Next, it's getting crowded in the "components" directory. Create a new directory within it called "\_\_tests\_\_", and move all of the **.test.js* files into it:

1. *About.test.js*
1. *AddUser.test.js*
1. *Form.test.js*
1. *NavBar.test.js*
1. *UsersList.test.js*
1. *App.test.js*

Update the imports. Ensure the tests still pass. Commit your code. Push to GitHub.
