---
title: React Authentication - part one
layout: post
permalink: part-three-react-auth-one
intro: false
part: 3
lesson: 8
share: true
---

Moving right along, let's add some methods to handle a user signing up, logging in, and logging out...

---

With the `Form` component set up, we can now configure the methods to:

1. Handle form submit event
1. Obtain user input
1. Send AJAX request
1. Update the page

> These steps should look familiar since we already went through this process in the [React Forms]({{site.url}}/part-two-react-forms) lesson. Put your skills to the test and implement the code on your own before going through this lesson.

### Handle form submit event

Turn to *Form.jsx*. Which method gets fired on the form submit?

```javascript
<form onSubmit={(event) => props.handleUserFormSubmit(event)}>
```

Add the method to the `App` component:

```javascript
handleUserFormSubmit(event) {
  event.preventDefault();
  console.log('sanity check!');
};
```

Bind the method in the constructor:

```javascript
this.handleUserFormSubmit = this.handleUserFormSubmit.bind(this);
```

And then pass it down via the `props`:

```javascript
<Route exact path='/register' render={() => (
  <Form
    formType={'Register'}
    formData={this.state.formData}
    handleUserFormSubmit={this.handleUserFormSubmit}
  />
)} />
<Route exact path='/login' render={() => (
  <Form
    formType={'Login'}
    formData={this.state.formData}
    handleUserFormSubmit={this.handleUserFormSubmit}
  />
)} />
```

To test, remove the `required` attribute on each of the form `input`s in *services/client/src/components/Form.jsx*. Then, you should see `sanity check!` in the JavaScript console on form submit for both forms in the browser.

Remove `console.log('sanity check!')` and add the `required` attributes back when done.

### Obtain user input

Next, to get the user inputs, add the following method to the `App` component:

```javascript
handleFormChange(event) {
  const obj = this.state.formData;
  obj[event.target.name] = event.target.value;
  this.setState(obj);
};
```

Again, bind it in the constructor, and then pass it down on the `props`:

```javascript
handleFormChange={this.handleFormChange}
```

Add a `console.log()` to the method - `console.log(this.state.formData);` - to ensure it works when you test it in the browser. Remove it once done.

What's next? AJAX!

### Send AJAX request

Update the `handleUserFormSubmit` method to send the data to the user service on a successful form submit:

```javascript
handleUserFormSubmit(event) {
  event.preventDefault();
  const formType = window.location.href.split('/').reverse()[0];
  let data = {
    email: this.state.formData.email,
    password: this.state.formData.password,
  };
  if (formType === 'register') {
    data.username = this.state.formData.username;
  }
  const url = `${process.env.REACT_APP_USERS_SERVICE_URL}/auth/${formType}`
  axios.post(url, data)
  .then((res) => {
    console.log(res.data);
  })
  .catch((err) => { console.log(err); });
};
```

Add a new `location` block to the Nginx config to handle requests to `/auth`:

```
location /auth {
  proxy_pass        http://users-service:5000;
  proxy_redirect    default;
  proxy_set_header  Host $host;
  proxy_set_header  X-Real-IP $remote_addr;
  proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header  X-Forwarded-Host $server_name;
}
```

Set the `REACT_APP_USERS_SERVICE_URL` environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d --build
```

Test the user registration out. If you have everything set up correctly, you should see an object in the JavaScript console with an auth token:

```json
{
  "auth_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0OTc3NTM2ODMsImlhdCI6MTQ5Nzc1MzY3OCwic3ViIjo0fQ.vcRFb5v3znHkz8An12QUxrgXsLqoKv93kIsMf-pdfVw",
  "message": "Successfully registered.",
  "status": "success"
}
```

Test logging in as well. Again, you should see the very same object in the console.

### Update the page

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

Try logging in again. After a successful login, open the "Application" tab in [Chrome DevTools](https://developer.chrome.com/devtools). Click the arrow before [LocalStorage](https://developers.google.com/web/tools/chrome-devtools/manage-data/local-storage) and select `http://localhost:3000`. You should see a key of `authToken` with a value of the actual token in the pane.

<div style="text-align:left;">
  <img src="/assets/img/course/03_react_auth_login.png" style="max-width: 100%; border:0; box-shadow: none;" alt="react auth">
</div>

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
  isAuthenticated: false,
};
```

Now, we can update the state in the `.then` within `handleUserFormSubmit()`:

```javascript
this.setState({
  formData: {username: '', email: '', password: '' },
  username: '',
  email: '',
  isAuthenticated: true,
});
```

Finally, to redirect the user after a successful log in or registration, pass `isAuthenticated` through to the `Form` component:

```javascript
<Route exact path='/register' render={() => (
  <Form
    formType={'Register'}
    formData={this.state.formData}
    handleUserFormSubmit={this.handleUserFormSubmit}
    handleFormChange={this.handleFormChange}
    isAuthenticated={this.state.isAuthenticated}
  />
)} />
<Route exact path='/login' render={() => (
  <Form
    formType={'Login'}
    formData={this.state.formData}
    handleUserFormSubmit={this.handleUserFormSubmit}
    handleFormChange={this.handleFormChange}
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

To test, log in and then make sure that you are redirected to `/`. Also, once logged in, you should be redirected if you try to go to the `/register` or `/login` links. Before moving on, try registering a new user. Did you notice that even though the redirect works, the users list is not updating?

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

### Logout

How about logging out? Add a new file called *Logout.test.js* to the  "services/client/src/components/\_\_tests\_\_" directory:

```javascript
import React from 'react';
import { shallow } from 'enzyme';

import Logout from '../Logout';

const logoutUser = jest.fn();

test('Logout renders properly', () => {
  const wrapper = shallow(<Logout logoutUser={logoutUser}/>);
  const element = wrapper.find('p');
  expect(element.length).toBe(1);
  expect(element.get(0).props.children[0]).toContain('You are now logged out.');
});
```

Here, we're using `jest.fn()` to [mock](http://facebook.github.io/jest/docs/en/mock-function-api.html#mockfnmockimplementationfn) the  `logoutUser` function. Ensure the tests fail, and then add a new component to the "components" folder called *Logout.jsx*:

```javascript
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Logout extends Component {
  componentDidMount() {
    this.props.logoutUser();
  };
  render() {
    return (
      <div>
        <p>You are now logged out. Click <Link to="/login">here</Link> to log back in.</p>
      </div>
    )
  };
};

export default Logout;
```

Then, add a `logoutUser` method to the `App` component to remove the token from LocalStorage and update the state.

```javascript
logoutUser() {
  window.localStorage.clear();
  this.setState({ isAuthenticated: false });
};
```

Bind the method:

```javascript
this.logoutUser = this.logoutUser.bind(this);
```

Import the component into *App.jsx*, and then add the new route:

```javascript
<Route exact path='/logout' render={() => (
  <Logout
    logoutUser={this.logoutUser}
    isAuthenticated={this.state.isAuthenticated}
  />
)} />
```

To test:

1. Log in
1. Verify that the token was added to LocalStorage
1. Log out
1. Verify that the token was removed from LocalStorage

Once you're done manually testing in the browser, ensure the unit tests pass. Then, add a snapshot test:

```javascript
test('Logout renders a snapshot properly', () => {
  const tree = renderer.create(
    <Router><Logout logoutUser={logoutUser}/></Router>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

We need to provide the `<Router>` context (via the [MemoryRouter](https://reacttraining.com/react-router/core/api/MemoryRouter)) since it's required in the component (by the `Link`).

Don't forget the imports:

```javascript
import renderer from 'react-test-renderer';
import { MemoryRouter as Router } from 'react-router-dom';
```

Commit your code.
