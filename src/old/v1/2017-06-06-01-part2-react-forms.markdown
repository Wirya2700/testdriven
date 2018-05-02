---
title: React Forms
layout: post
date: 2017-06-06 23:59:58
permalink: part-two-react-forms
intro: false
part: 2
lesson: 7
share: true
---

In this lesson, we'll create a new functional component for adding a new user....

---

Within *flask-microservices-client*, add a new file called *AddUser.jsx* to the "components" directory:

```javascript
import React from 'react';

const AddUser = (props) => {
  return (
    <form>
      <div className="form-group">
        <input
          name="username"
          className="form-control input-lg"
          type="text"
          placeholder="Enter a username"
          required
        />
      </div>
      <div className="form-group">
        <input
          name="email"
          className="form-control input-lg"
          type="email"
          placeholder="Enter an email address"
          required
        />
      </div>
      <input
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        value="Submit"
      />
    </form>
  )
}

export default AddUser;
```

Import the component in *index.js*:

```javascript
import AddUser from './components/AddUser';
```

Then update the `render` method:

```javascript
render() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <br/>
          <h1>All Users</h1>
          <hr/><br/>
          <AddUser/>
          <br/>
          <UsersList users={this.state.users}/>
        </div>
      </div>
    </div>
  )
}
```

Ensure the `dev` machine is up and running and the `REACT_APP_USERS_SERVICE_URL` environment variable is properly assigned to the IP associated with the `dev` machine. Run `npm start` to test. If all went well, you should see the form along with the users.

Now, since this is a single page application, we want to prevent the normal browser behavior when a form is submitted to avoid a page refresh.

*Steps*:

1. Handle Form Submit Event
1. Obtain User Input
1. Send AJAX Request
1. Update The Page

#### <span style="font-family:'Montserrat', 'sans-serif';">Handle Form Submit Event</span>

To handle the submit event, simply update the `form` element in *AddUser.jsx*:

```javascript
<form onSubmit={(event) => event.preventDefault()}>
```

Try submitting the form. Nothing should happen, which is exactly what we want - we prevented the normal browser behavior.

Next, add the following method to the `App` component:

```javascript
addUser(event) {
  event.preventDefault();
  console.log('sanity check!')
}
```

Since `AddUser` is a functional component, we need to pass this method down to it via props. Update the `AddUser` element like so:

```javascript
<AddUser addUser={this.addUser.bind(this)}/>
```

Update the `form` element again:

```javascript
<form onSubmit={(event) => props.addUser(event)}>
```

Here, we bound the context of `this` manually via `bind()`. Without it, the context of `this` inside the method will not have the correct context. Want to test this out? Simply add `console.log(this)` to `addUser()` and then submit the form. What's the context? Remove the `bind` and test it again. What's the context now?

> For more on this, review [Handling Events](https://facebook.github.io/react/docs/handling-events.html) from the official React docs.

Test it out in the browser. You should see `sanity check!` in the JavaScript console on form submit.

#### <span style="font-family:'Montserrat', 'sans-serif';">Obtain User Input</span>

We'll use [controlled components](https://facebook.github.io/react/docs/forms.html#controlled-components) to obtain the user submitted input.

Start by adding two new properties to the state object:

```javascript
this.state = {
  users: [],
  username: '',
  email: ''
}
```

Then pass them through to the component:

```javascript
<AddUser
  username={this.state.username}
  email={this.state.email}
  addUser={this.addUser.bind(this)}
/>
```

These are accessible now via `props`, which can be used as the current value of the input like so:

```javascript
<div className="form-group">
  <input
    name="username"
    className="form-control input-lg"
    type="text"
    placeholder="Enter a username"
    required
    value={props.username}
  />
</div>
<div className="form-group">
  <input
    name="email"
    className="form-control input-lg"
    type="email"
    placeholder="Enter an email address"
    required
    value={props.email}
  />
</div>
```

So, this defines the value of the inputs from the parent component. Test out the form now. What happens? You shouldn't see anything being typed since the value is being "pushed" down from the parent.

> What do you think will happen if the initial state of those values was set as `test` rather than an empty string? Try it.

How do we update the state in the parent component then?

First, add a `handleChange` method to the `App` component:

```javascript
handleChange(event) {
  const obj = {};
  obj[event.target.name] = event.target.value;
  this.setState(obj);
}
```

Pass it to the component:

```javascript
<AddUser
  username={this.state.username}
  email={this.state.email}
  handleChange={this.handleChange.bind(this)}
  addUser={this.addUser.bind(this)}
/>
```

Add it to the form inputs:

```javascript
<div className="form-group">
  <input
    name="username"
    className="form-control input-lg"
    type="text"
    placeholder="Enter a username"
    required
    value={props.username}
    onChange={props.handleChange}
  />
</div>
<div className="form-group">
  <input
    name="email"
    className="form-control input-lg"
    type="email"
    placeholder="Enter an email address"
    required
    value={props.email}
    onChange={props.handleChange}
  />
</div>
```

Test the form out now. It should be working. You can see the value of the state by logging it to the console in the `addUser` method:

```javascript
addUser(event) {
  event.preventDefault();
  console.log(this.state);
}
```

Now that we have the values, let's send the AJAX request so the data can be added to the database and then update the DOM...

#### <span style="font-family:'Montserrat', 'sans-serif';">Send AJAX Request</span>

Turn back to *flask-microservices-users*. What do we need to send in the JSON payload to add a user - username and email, right? Let's use Axios to send the POST request:

```javascript
addUser(event) {
  event.preventDefault();
  const data = {
    username: this.state.username,
    email: this.state.email
  }
  axios.post(`${process.env.REACT_APP_USERS_SERVICE_URL}/users`, data)
  .then((res) => { console.log(res); })
  .catch((err) => { console.log(err); })
}
```

Test it out. It should work as long as the email address is unique.

> If you have problems, analyze the response object from the "Network" tab in Developer Tools. You can also fire up *flask-microservices-users* outside of Docker and debug using the Flask debugger or with `print` statements.

#### <span style="font-family:'Montserrat', 'sans-serif';">Update The Page</span>

Finally, let's update the list of users on a successful form submit and then clear the form.

```javascript
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
```

That's it. Test it out. Review and then commit your code.
