---
title: React Flash Messaging
layout: post
date: 2017-06-27 23:59:59
permalink: part-four-react-flash-messages
intro: false
part: 4
lesson: 6
share: true
---

Let's add flash messaging to send quick alerts to the end user...

---

#### <span style="font-family:'Montserrat', 'sans-serif';">Create Message</span>

Start by adding `.expect(Selector('.alert-success').withText('Welcome!').exists).ok()` to the *should allow a user to sign in* test:

```javascript
...
// assert user is redirected to '/'
// assert '/' is displayed properly
const tableRow = Selector('td').withText(username).parent();
await t
  .expect(Selector('H1').withText('All Users').exists).ok()
  .expect(tableRow.child().withText(username).exists).ok()
  .expect(tableRow.child().withText(email).exists).ok()
  .expect(Selector('a').withText('User Status').exists).ok()
  .expect(Selector('a').withText('Log Out').exists).ok()
  .expect(Selector('a').withText('Register').exists).notOk()
  .expect(Selector('a').withText('Log In').exists).notOk()
  .expect(Selector('.alert-success').withText('Welcome!').exists).ok()
...
```

Ensure the tests fail.

Then, add a new functional component, called `Message` to a new component file called *Message.jsx*, which is responsible *only* for displaying a message:

```javascript
import React from 'react';

const Message = (props) => {
  return (
    <div className={`alert alert-${props.messageType}`}>
      <span
        className="glyphicon glyphicon-exclamation-sign"
        aria-hidden="true">
      </span>
      <span>&nbsp;{props.messageName}</span>
      <button
        className='close'
        data-dismiss='alert'
      >&times;</button>
    </div>
  )
}

export default Message
```

Now that the component is ready to go, let's wire it up to the `App` component:

1. Add `messageName` and `messageType` to the state:

    ```javascript
    this.state = {
      users: [],
      title: 'TestDriven.io',
      isAuthenticated: false,
      messageName: null,
      messageType: null
    }
    ```

1. Import the `Message` component:

    ```javascript
    import Message from './components/Message';
    ```

1. Render the component, just below the `NavBar`:

    ```javascript
    <div>
      <NavBar
        title={this.state.title}
        isAuthenticated={this.state.isAuthenticated}
      />
      <div className="container">
        {this.state.messageName && this.state.messageType &&
          <Message
            messageName={this.state.messageName}
            messageType={this.state.messageType}
          />
        }
    ...
    ```

1. Finally, add a `createMessage` method, with default parameters, to test:

    ```javascript
    createMessage(name='Sanity Check', type='success') {
      this.setState({
        messageName: name,
        messageType: type
      })
    }
    ```

    Call it in the `componentDidMount` Lifecycle Method.

Re-build, and then manually test in the browser. You should see the alert on every route. To get the tests to pass though, we need to dynamically create the message.

Remove the call in `componentDidMount()`, and, instead, call the method in `loginUser()`:

```javascript
loginUser(token) {
  window.localStorage.setItem('authToken', token);
  this.setState({ isAuthenticated: true });
  this.getUsers();
  this.createMessage('Welcome!', 'success');
}
```

Run the tests again, after you update the containers. They should pass.

Turn to the tests. What else do we need to test? Update *should display the page correctly if a user is not logged in* to ensure the message is not displayed on page load:

```javascript
test(`should display the page correctly if a user is not logged in`, async (t) => {
  await t
    .navigateTo(TEST_URL)
    .expect(Selector('H1').withText('All Users').exists).ok()
    .expect(Selector('a').withText('User Status').exists).notOk()
    .expect(Selector('a').withText('Log Out').exists).notOk()
    .expect(Selector('a').withText('Register').exists).ok()
    .expect(Selector('a').withText('Log In').exists).ok()
    .expect(Selector('.alert').exists).notOk()
});
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Error Messages</span>

Let's use the flash message system to properly handle errors...

`/register`:

1. should throw an error if the username is taken

    ```javascript
    test(`should throw an error if the username is taken`, async (t) => {

      // register user with duplicate user name
      await t
        .navigateTo(`${TEST_URL}/register`)
        .typeText('input[name="username"]', username)
        .typeText('input[name="email"]', `${email}unique`)
        .typeText('input[name="password"]', password)
        .click(Selector('input[type="submit"]'))

      // assert user registration failed
      await t
        .expect(Selector('H1').withText('Register').exists).ok()
        .expect(Selector('a').withText('User Status').exists).notOk()
        .expect(Selector('a').withText('Log Out').exists).notOk()
        .expect(Selector('a').withText('Register').exists).ok()
        .expect(Selector('a').withText('Log In').exists).ok()
        .expect(Selector('.alert-success').exists).notOk()
        .expect(Selector('.alert-danger').withText(
          'That user already exists.').exists).ok()

    });
    ```

1. should throw an error if the email is taken

    ```javascript
    test(`should throw an error if the email is taken`, async (t) => {

      // register user with duplicate email
      await t
        .navigateTo(`${TEST_URL}/register`)
        .typeText('input[name="username"]', `${username}unique`)
        .typeText('input[name="email"]', email)
        .typeText('input[name="password"]', password)
        .click(Selector('input[type="submit"]'))

      // assert user registration failed
      await t
        .expect(Selector('H1').withText('Register').exists).ok()
        .expect(Selector('a').withText('User Status').exists).notOk()
        .expect(Selector('a').withText('Log Out').exists).notOk()
        .expect(Selector('a').withText('Register').exists).ok()
        .expect(Selector('a').withText('Log In').exists).ok()
        .expect(Selector('.alert-success').exists).notOk()
        .expect(Selector('.alert-danger').withText(
          'That user already exists.').exists).ok()

    });
    ```

`/login`:

1. should throw an error if the credentials are incorrect

    ```javascript
    test(`should throw an error if the credentials are incorrect`, async (t) => {

      // attempt to log in
      await t
        .navigateTo(`${TEST_URL}/login`)
        .typeText('input[name="email"]', 'incorrect@email.com')
        .typeText('input[name="password"]', password)
        .click(Selector('input[type="submit"]'))

      // assert user login failed
      await t
        .expect(Selector('H1').withText('Login').exists).ok()
        .expect(Selector('a').withText('User Status').exists).notOk()
        .expect(Selector('a').withText('Log Out').exists).notOk()
        .expect(Selector('a').withText('Register').exists).ok()
        .expect(Selector('a').withText('Log In').exists).ok()
        .expect(Selector('.alert-success').exists).notOk()
        .expect(Selector('.alert-danger').withText(
          'User does not exist.').exists).ok()

      // attempt to log in
      await t
        .navigateTo(`${TEST_URL}/login`)
        .typeText('input[name="email"]', email)
        .typeText('input[name="password"]', 'incorrectpassword')
        .click(Selector('input[type="submit"]'))

      // assert user login failed
      await t
        .expect(Selector('H1').withText('Login').exists).ok()
        .expect(Selector('a').withText('User Status').exists).notOk()
        .expect(Selector('a').withText('Log Out').exists).notOk()
        .expect(Selector('a').withText('Register').exists).ok()
        .expect(Selector('a').withText('Log In').exists).ok()
        .expect(Selector('.alert-success').exists).notOk()
        .expect(Selector('.alert-danger').withText(
          'User does not exist.').exists).ok()

    });
    ```

Add `createMessage` to the `Form` component via the props:

```javascript
...
<Route exact path='/register' render={() => (
  <Form
    formType={'register'}
    isAuthenticated={this.state.isAuthenticated}
    loginUser={this.loginUser.bind(this)}
    createMessage={this.createMessage.bind(this)}
  />
)} />
<Route exact path='/login' render={() => (
  <Form
    formType={'login'}
    isAuthenticated={this.state.isAuthenticated}
    loginUser={this.loginUser.bind(this)}
    createMessage={this.createMessage.bind(this)}
  />
)} />
...
```

Then update `handleUserFormSubmit()`:

```javascript
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
  .catch((err) => {
    if (formType === 'login') {
      this.props.createMessage('User does not exist.', 'danger')
    }
    if (formType === 'register') {
      this.props.createMessage('That user already exists.', 'danger')
    }
  })
}
```

Update the containers, and then test.

> `User does not exist` isn't really accurate if it was just an incorrect password; `Login failed` is probably a better generic error message. Check your understanding and update this on your own.

#### <span style="font-family:'Montserrat', 'sans-serif';">Delete Message</span>

Next, the message should disappear when any of these occur-

1. An end user clicks the `x`, on the right side of the message
1. A new message is flashed
1. Three seconds passes

Create a new test file called *message.test.js*:

```javascript
import { Selector } from 'testcafe';

const randomstring = require('randomstring');

const username = randomstring.generate();
const email = `${username}@test.com`;
const password = 'greaterthanten';

const TEST_URL = process.env.TEST_URL;

fixture('/register').page(`${TEST_URL}/register`);

test.only(`should display flash messages correctly`, async (t) => {

  // register user
  await t
    .navigateTo(`${TEST_URL}/register`)
    .typeText('input[name="username"]', username)
    .typeText('input[name="email"]', email)
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))

  // assert flash messages are removed when user clicks the 'x'
  await t
    .expect(Selector('.alert-success').withText('Welcome!').exists).ok()
    .click(Selector('.alert > button'))
    .expect(Selector('.alert-success').withText('Welcome!').exists).notOk()

  // log a user out
  await t
    .click(Selector('a').withText('Log Out'))

  // attempt to log in
  await t
    .navigateTo(`${TEST_URL}/login`)
    .typeText('input[name="email"]', 'incorrect@email.com')
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))

  // assert correct message is flashed
  await t
    .expect(Selector('.alert-success').exists).notOk()
    .expect(Selector('.alert-danger').withText(
      'User does not exist.').exists).ok()

  // log a user in
  await t
    .navigateTo(`${TEST_URL}/login`)
    .typeText('input[name="email"]', email)
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))

  // assert flash message is removed when a new message is flashed
  await t
    .expect(Selector('.alert-success').withText('Welcome!').exists).ok()
    .expect(Selector('.alert-danger').withText(
      'User does not exist.').exists).notOk()

  // log a user out
  await t
    .click(Selector('a').withText('Log Out'))

  // log a user in
  await t
    .navigateTo(`${TEST_URL}/login`)
    .typeText('input[name="email"]', email)
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))

  // assert flash message is removed after three seconds
  await t
    .expect(Selector('.alert-success').withText('Welcome!').exists).ok()
    .wait(4000)
    .expect(Selector('.alert-success').withText('Welcome!').exists).notOk()

});
```

To get the first set of expects - `assert flash messages are removed when user clicks the 'x'` - to pass, add a `removeMessage` method to the `App` component:

```javascript
removeMessage() {
  this.setState({
    messageName: null,
    messageType: null
  })
}
```

Pass it down on the `props`:

```javascript
...
<div className="container">
  {this.state.messageName && this.state.messageType &&
    <Message
      messageName={this.state.messageName}
      messageType={this.state.messageType}
      removeMessage={this.removeMessage.bind(this)}
    />
  }
...
```

Then update the `button`, so that the `removeMessage` method is fired on click:

```javascript
const Message = (props) => {
  return (
    <div className={`alert alert-${props.messageType}`}>
      <span
        className="glyphicon glyphicon-exclamation-sign"
        aria-hidden="true">
      </span>
      <span>&nbsp;{props.messageName}</span>
      <button
        className='close'
        data-dismiss='alert'
        onClick={()=>{props.removeMessage()}}
      >&times;</button>
    </div>
  )
}
```

Run the tests again.

> Is there any way to mock the wait time so that the test doesn't *actually* take an extra four seconds to run?

Did you notice that the next set of expects passed - `assert flash message is removed when a new message is flashed`? To get the last set to pass, add a `setTimeout` to `createMessage()`:


```javascript
createMessage(name='Sanity Check', type='success') {
  this.setState({
    messageName: name,
    messageType: type
  })
  setTimeout(() => {
    this.removeMessage()
  }, 3000);
}
```

Re-build. Run your tests. Commit your code.
