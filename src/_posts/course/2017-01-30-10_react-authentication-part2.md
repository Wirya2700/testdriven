---
title: React Authentication - part two
layout: post
permalink: part-three-react-auth-two
intro: false
part: 3
lesson: 10
share: true
---

Moving right along, let's add some methods to handle a user signing up, logging in, and logging out...

---

### User Status

For the `/status` link, we need to add a new component that displays the response from a call to `/auth/status` from the users service. *Remember*: You need to be authenticated to hit this end-point successfully. So, we will need to add the token to the header prior to sending the AJAX request.

First, add a new component called *UserStatus.jsx*:

```javascript
import React, { Component } from 'react';
import axios from 'axios';

class UserStatus extends Component {
  constructor (props) {
    super(props);
    this.state = {
      email: '',
      id: '',
      username: ''
    };
  };
  componentDidMount() {
    this.getUserStatus();
  };
  getUserStatus(event) {
    const options = {
      url: `${process.env.REACT_APP_USERS_SERVICE_URL}/auth/status`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${window.localStorage.authToken}`
      }
    };
    return axios(options)
    .then((res) => { console.log(res.data.data) })
    .catch((error) => { console.log(error); });
  };
  render() {
    return (
      <div>
        <p>test</p>
      </div>
    )
  };
};

export default UserStatus;
```

Here, we used a stateful, class-based component to give the component its own internal state. Notice how we also included the header with the AJAX request.

Import the component into *App.jsx*, and then add a new route:

```javascript
<Route exact path='/status' component={UserStatus}/>
```

Test this out first when you're not logged in. You should see a 401 error in the JavaScript console. Try again when you are logged in. You should see an object with the keys `active`, `email`, `id`, and `username`.

To add the values to the component, update the `.then`:

```javascript
.then((res) => {
  this.setState({
    email: res.data.data.email,
    id: res.data.data.id,
    username: res.data.data.username
  })
})
```

Also, update the `render()`:

```javascript
render() {
  return (
    <div>
      <ul>
        <li><strong>User ID:</strong> {this.state.id}</li>
        <li><strong>Email:</strong> {this.state.email}</li>
        <li><strong>Username:</strong> {this.state.username}</li>
      </ul>
    </div>
  )
};
```

Test it out.

### Update Navbar

Finally, let's make the following changes to the `Navbar`:

1. When the user is logged in, the register and log in links should be hidden
1. When the user is logged out, the log out and user status links should be hidden

Update the `NavBar` component like so to show/hide based on the value of `isAuthenticated`:

```javascript
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
        {props.isAuthenticated &&
          <LinkContainer to="/status">
            <NavItem eventKey={3}>User Status</NavItem>
          </LinkContainer>
        }
      </Nav>
      <Nav pullRight>
        {!props.isAuthenticated &&
          <LinkContainer to="/register">
            <NavItem eventKey={1}>Register</NavItem>
          </LinkContainer>
        }
        {!props.isAuthenticated &&
          <LinkContainer to="/login">
            <NavItem eventKey={2}>Log In</NavItem>
          </LinkContainer>
        }
        {props.isAuthenticated &&
          <LinkContainer to="/logout">
            <NavItem eventKey={3}>Log Out</NavItem>
          </LinkContainer>
        }
      </Nav>
    </Navbar.Collapse>
  </Navbar>
)
```

Make sure to pass `isAuthenticated` down on the `props`:

```javascript
<NavBar
  title={this.state.title}
  isAuthenticated={this.state.isAuthenticated}
/>
```

This merely hides the links. An unauthenticated user could still access the route via entering the URL into the URL bar. To restrict access, update the `render()` in *UserStatus.jsx*:

```javascript
render() {
  if (!this.props.isAuthenticated) {
    return <p>You must be logged in to view this. Click <Link to="/login">here</Link> to log back in.</p>
  };
  return (
    <div>
      <ul>
        <li><strong>User ID:</strong> {this.state.id}</li>
        <li><strong>Email:</strong> {this.state.email}</li>
        <li><strong>Username:</strong> {this.state.username}</li>
      </ul>
    </div>
  )
};
```

Add the import:

```javascript
import { Link } from 'react-router-dom';
```

Then update the route in the `App` component:

```javascript
<Route exact path='/status' render={() => (
  <UserStatus
    isAuthenticated={this.state.isAuthenticated}
  />
)} />
```

Open the JavaScript console, and then try this out. Did you notice that the AJAX request still fires when you were unauthenticated?

<div style="text-align:left;">
  <img src="/assets/img/course/03_react_auth_status.png" style="max-width: 100%; border:0; box-shadow: none;" alt="react auth">
</div>

To fix, add a conditional to the `componentDidMount()` in the `UserStatus` component:

```javascript
componentDidMount() {
  if (this.props.isAuthenticated) {
    this.getUserStatus();
  }
};
```

Commit your code.
