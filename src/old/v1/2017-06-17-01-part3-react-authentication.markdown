---
title: React Authentication
layout: post
date: 2017-06-17 23:59:59
permalink: part-three-react-authentication
intro: false
part: 3
lesson: 8
share: true
---

Let's add some methods to handle a user signing up, logging in, and logging out...

---

With the `Form` component set up, we can now configure the methods to:

1. Handle Form Submit Event
1. Obtain User Input
1. Send AJAX Request
1. Update The Page

> These steps should look familiar since we already went through this process in the [React Forms]({{site.url}}/part-two-react-forms) lesson. Put your skills to the test and implement the code on your own before going through this lesson.

#### <span style="font-family:'Montserrat', 'sans-serif';">Handle Form Submit Event</span>

Turn to *Form.jsx*. Which method gets fired on the form submit?

```javascript
<form onSubmit={(event) => props.handleUserFormSubmit(event)}>
```

Add the method to the `App` component:

```javascript
handleUserFormSubmit(event) {
  event.preventDefault();
  console.log('sanity check!')
}
```

And then pass it down via the `props`:

```javascript
<Route exact path='/register' render={() => (
  <Form
    formType={'Register'}
    formData={this.state.formData}
    handleUserFormSubmit={this.handleUserFormSubmit.bind(this)}
  />
)} />
<Route exact path='/login' render={() => (
  <Form
    formType={'Login'}
    formData={this.state.formData}
    handleUserFormSubmit={this.handleUserFormSubmit.bind(this)}
  />
)} />
```

To test, remove the `required` attribute on each of the form `input`s in *src/components/Form.jsx*. Then, you should see `sanity check!` in the JavaScript console on form submit for both forms in the browser.

Remove `console.log('sanity check!')` and add the `required` attributes back when done.

#### <span style="font-family:'Montserrat', 'sans-serif';">Obtain User Input</span>

Next, to get the user inputs, add the following method to `App`:

```javascript
handleFormChange(event) {
  const obj = this.state.formData;
  obj[event.target.name] = event.target.value;
  this.setState(obj);
}
```

Pass it down on the `props`:

```javascript
handleFormChange={this.handleFormChange.bind(this)}
```

Add a `console.log()` to the method - `console.log(this.state.formData);` - to ensure it works when you test it in the browser. Remove it once done.

What's next? AJAX!

#### <span style="font-family:'Montserrat', 'sans-serif';">Send AJAX Request</span>

Update the `handleUserFormSubmit` method to send the data to the user service on a successful form submit:

```javascript
handleUserFormSubmit(event) {
  event.preventDefault();
  const formType = window.location.href.split('/').reverse()[0];
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
    console.log(res.data);
  })
  .catch((err) => { console.log(err); })
}
```

Test the user registration out. If you have everything set up correctly, you should see an object in the JavaScript console with an auth token:

```
{
  auth_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0OTc3NTM2ODMsImlhdCI6MTQ5Nzc1MzY3OCwic3ViIjo0fQ.vcRFb5v3znHkz8An12QUxrgXsLqoKv93kIsMf-pdfVw",
  message: "Successfully registered.",
  status: "success"
}
```

Test logging in as well. Again, you should see the very same object in the console.

#### <span style="font-family:'Montserrat', 'sans-serif';">Update The Page</span>

After a user register or logs in, we need to:

1. Clear the `formData` object
1. Save the auth token in the browser's [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage), a client-side data store
1. Update the state to indicate that the user is authenticated
1. Redirect the user to `/`

First, to clear the form, update the `.then` within `handleUserFormSubmit()`:

```javascript
.then((res) => {
  this.setState({
    formData: {username: '', email: '', password: '' },
    username: '',
    email: ''
  });
})
```

Try this out. After you register or log in, the field inputs should be cleared since we set the properties in the `formData` object to empty strings.

> What happens if you enter data for the registration form but *don't* submit it and then navigate to the login form? The fields should remain. Is this okay? Should we clear the state on page load? Your call. You could simply update the state within the `componentWillMount` lifecycle method.

Next, let's save the auth token in LocalStorage so that we can use it for subsequent API calls that require a user to be authenticated. To do this, add the following code to the `.then`, just below the `setState`:

```javascript
window.localStorage.setItem('authToken', res.data.auth_token);
```

Try logging in again. After a successful login, open the Application tab within [Chrome DevTools](https://developer.chrome.com/devtools). Click the arrow before [LocalStorage](https://developers.google.com/web/tools/chrome-devtools/manage-data/local-storage) and select `http://localhost:3000`. You should see a key of `authToken` with a value of the actual token in the pane.

Instead of always checking LocalStorage for the auth token, let's add a boolean to the state so we can quickly tell if there is a user authenticated.

Add an `isAuthenticated` property to the state:

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
  },
  isAuthenticated: false
}
```

Now, we can update the state in the `.then` within `handleUserFormSubmit()`:

```javascript
this.setState({
  formData: {username: '', email: '', password: '' },
  username: '',
  email: '',
  isAuthenticated: true
});
```

Finally, to redirect the user after a successful log in or registration, pass `isAuthenticated` through to the `Form` component:

```javascript
<Route exact path='/register' render={() => (
  <Form
    formType={'Register'}
    formData={this.state.formData}
    handleFormChange={this.handleFormChange.bind(this)}
    handleUserFormSubmit={this.handleUserFormSubmit.bind(this)}
    isAuthenticated={this.state.isAuthenticated}
  />
)} />
<Route exact path='/login' render={() => (
  <Form
    formType={'Login'}
    formData={this.state.formData}
    handleFormChange={this.handleFormChange.bind(this)}
    handleUserFormSubmit={this.handleUserFormSubmit.bind(this)}
    isAuthenticated={this.state.isAuthenticated}
  />
)} />
```

Then, within *Form.jsx* add the following conditional right before the `return`:

```javascript
if (props.isAuthenticated) {
  return <Redirect to='/' />;
}
```

Add the import:

```javascript
import { Redirect } from 'react-router-dom';
```

To test, log in and then make sure that you are redirected to `/`. Also, you should be redirected if you try to go to the `/register` or `/login` links. Before moving on, try registering a new user. Did you notice that even though the redirect works, the users list is not updating?

To update that, fire `this.getUsers()` in the `.then` within `handleUserFormSubmit()`:

```javascript
.then((res) => {
  this.setState({
    formData: {username: '', email: '', password: ''},
    username: '',
    email: '',
    isAuthenticated: true
  });
  window.localStorage.setItem('authToken', res.data.auth_token);
  this.getUsers();
})
```

Test it out again.

#### <span style="font-family:'Montserrat', 'sans-serif';">Logout</span>

How about logging out? Add a new component to the "components" folder called *Logout.jsx*:

```javascript
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Logout extends Component {
  componentDidMount() {
    this.props.logoutUser();
  }
  render() {
    return (
      <div>
        <p>You are now logged out. Click <Link to="/login">here</Link> to log back in.</p>
      </div>
    )
  }
}

export default Logout
```

Then, add a `logoutUser` method to the `App` component to remove the token from LocalStorage and update the state.

```javascript
logoutUser() {
  window.localStorage.clear();
  this.setState({ isAuthenticated: false });
}
```

Import the component into *App.jsx*, and then add the new route:

```javascript
<Route exact path='/logout' render={() => (
  <Logout
    logoutUser={this.logoutUser.bind(this)}
    isAuthenticated={this.state.isAuthenticated}
  />
)} />
```

To test:

1. Log in
1. Verify that the token was added to LocalStorage
1. Log out
1. Verify that the token was removed from LocalStorage

#### <span style="font-family:'Montserrat', 'sans-serif';">User Status</span>

For the `/status` link, we need to add a new component that displays the response from a call to `/auth/status` on the users service. *Remember*: You need to be authenticated to hit this end-point successfully. So, we will need to add the token to the header prior to sending the AJAX request.

First, add a new component called *UserStatus.jsx*:

```javascript
import React, { Component } from 'react';
import axios from 'axios';

class UserStatus extends Component {
  constructor (props) {
    super(props)
    this.state = {
      created_at: '',
      email: '',
      id: '',
      username: ''
    }
  }
  componentDidMount() {
    this.getUserStatus();
  }
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
    .catch((error) => { console.log(error); })
  }
  render() {
    return (
      <div>
        <p>test</p>
      </div>
    )
  }
}

export default UserStatus
```

Here, we used a stateful, class-based component to give the component its own internal state. Notice how we also included the header with the AJAX request.

Import the component into *App.jsx*, and then add a new route:

```javascript
<Route exact path='/status' component={UserStatus}/>
```

Test this out first when you're not logged in. You should see a 401 error in the JavaScript console. Try again when you are logged in. You should see an object with the keys `active`, `created_at`, `email`, `id`, and `username`.

To add the values to the component, update the `.then`:

```javascript
.then((res) => {
  this.setState({
    created_at: res.data.data.created_at,
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
}
```

Test it out.

#### <span style="font-family:'Montserrat', 'sans-serif';">Update Navbar Links</span>

Finally, let's make the following changes to the Navbar:

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
  }
  return (
    <div>
      <ul>
        <li><strong>User ID:</strong> {this.state.id}</li>
        <li><strong>Email:</strong> {this.state.email}</li>
        <li><strong>Username:</strong> {this.state.username}</li>
      </ul>
    </div>
  )
}
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

Open the JavaScript console, and then try this out. Did you notice that the AJAX request still fires when you were unauthenticated? To fix, add a conditional to the `componentDidMount()` in the `UserStatus` component:

```javascript
componentDidMount() {
  if (this.props.isAuthenticated) {
    this.getUserStatus();
  }
}
```

Commit your code.
