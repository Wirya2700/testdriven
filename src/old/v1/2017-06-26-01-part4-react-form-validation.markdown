---
title: React Form Validation
layout: post
date: 2017-06-26 23:59:59
permalink: part-four-react-form-validation
intro: false
part: 4
lesson: 5
share: true
---

In this lesson, we'll add form validation to the register and sign in forms ([example](https://www.youtube.com/watch?v=cN1IzZDgxZo))...

---

Turn to *flask-microservices-client*.

Since we are using [controlled inputs](https://facebook.github.io/react/docs/forms.html#controlled-components) to obtain the user submitted input, we can evaluate whether the form is valid on every value change since the input values are on the state.

Validation rules:

1. Username and email are greater than 5 characters
1. Password must be greater than 10 characters
1. Email is a valid email address (`something@something.something`)

Since we now have a means of testing on the client, let's test-drive this change.


#### <span style="font-family:'Montserrat', 'sans-serif';">Disable Button</span>

Let's add a `disabled` attribute to the button and set the initial value to `true` so the form cannot be submitted. Then, when the form validates properly, `disabled` will be set to `false`.

Add the following assert to *should display the registration form* and *should display the sign in form*:

```javascript
.expect(Selector('input[disabled]').exists).ok()
```

Re-build and then run the tests. Ensure they fail, and then update the `input` button in *src/components/Form.jsx*:

```javascript
<input
  type="submit"
  className="btn btn-primary btn-lg btn-block"
  value="Submit"
  disabled=true
/>
```

Re-build and run again. Those specific tests will pass, but a number of new ones will fail since the form can no longer be submitted. To update that, let's validate the form on submit.

Add a new property called `valid` to the state in the `Form()` component:

```javascript
this.state = {
  formData: {
    username: '',
    email: '',
    password: ''
  },
  valid: false
}
```

As the name suggests, when `valid` is `true`, the form input values are valid and the form can be properly submitted.

Next, update the `input` button again, changing how the `disabled` attribute is set:

```javascript
<input
  type="submit"
  className="btn btn-primary btn-lg btn-block"
  value="Submit"
  disabled={!this.state.valid}
/>
```

So, when the form is valid, `disabled` is `false`. Next, Add a method to update the state of `valid`:

```javascript
validateForm() {
  this.setState({valid: true});
}
```

When should we call this method?

```javascript
handleFormChange(event) {
  const obj = this.state.formData;
  obj[event.target.name] = event.target.value;
  this.setState(obj);
  this.validateForm()
}
```

Re-build. Run the tests.

We still need to add validation logic to `validateForm()`, but before that we need to define the rules...

#### <span style="font-family:'Montserrat', 'sans-serif';">Validation Rules</span>

Next, let's add the validation rules below each input field, starting with some tests...

Update *should display the sign in form*

```javascript
test(`should display the sign in form`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/login`)
    .expect(Selector('H1').withText('Login').exists).ok()
    .expect(Selector('form').exists).ok()
    .expect(Selector('input[disabled]').exists).ok()
    .expect(Selector('.validation-list').exists).ok()
    .expect(Selector('.validation-list > .error').nth(0).withText(
      'Email must be greater than 5 characters.').exists).ok()
});
```

Update *should display the registration form*

```javascript
test(`should display the registration form`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/register`)
    .expect(Selector('H1').withText('Register').exists).ok()
    .expect(Selector('form').exists).ok()
    .expect(Selector('input[disabled]').exists).ok()
    .expect(Selector('.validation-list').exists).ok()
    .expect(Selector('.validation-list > .error').nth(0).withText(
      'Username must be greater than 5 characters.').exists).ok()
});
```

To fix, we first need to define the rules:

```javascript
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
```

You could render these within the `Form` component, but since there is a bit of logic separate from the form, let's create a new functional component.

*FormErrors.jsx*:

```javascript
import React from 'react';

import './FormErrors.css';

const FormErrors = (props) => {
  return (
    <div>
      <ul className="validation-list">
        {
          // eslint-disable-next-line
          props.formRules.map((rule) => {
            if (rule.field === 'username') {
              if (props.formType === 'register') {
                return <li className="error" key={rule.id}>{rule.name}</li>
              }
            } else {
              return <li className="error" key={rule.id}>{rule.name}</li>
            }
          })
        }
      </ul>
    </div>
  )
}

export default FormErrors;
```

Add this file to the "components" directory, and then add the associated styles to a new file called *FormErrors.css*:

```css
.validation-list {
  padding-left: 25px;
}

.validation-list > li {
  display: block;
}

li:before {
  font-family: 'Glyphicons Halflings';
  font-size: 9px;
  float: left;
  margin-top: 4px;
  margin-left: -17px;
}

.error {
  color: red;
}

.error:before {
  content: "\e014";
  color: red;
}

.success {
  color: green;
}

.success:before {
  content: "\e013";
  color: green;
}
```

Finally, render the component just above the form, back within the `Form` component:

{% raw %}
```javascript
<div>
  <h1 style={{'textTransform':'capitalize'}}>{this.props.formType}</h1>
  <hr/><br/>
  <FormErrors
    formType={this.props.formType}
    formRules={this.state.formRules}
  />
  <form onSubmit={(event) => this.handleUserFormSubmit(event)}>
  ...
```
{% endraw %}

Run the tests.

#### <span style="font-family:'Montserrat', 'sans-serif';">Validate Password Input</span>

To keep things simple, we can start with validating a single input. To test, add the following spec to the login tests:

```javascript
test.only(`should validate the password field`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/login`)
    .expect(Selector('H1').withText('Login').exists).ok()
    .expect(Selector('form').exists).ok()
    .expect(Selector('input[disabled]').exists).ok()
    .expect(Selector('.validation-list > .error').nth(2).withText(
      'Password must be greater than 10 characters.').exists).ok()
    .typeText('input[name="password"]', 'greaterthanten')
    .expect(Selector('.validation-list').exists).ok()
    .expect(Selector('.validation-list > .error').nth(2).withText(
      'Password must be greater than 10 characters.').exists).notOk()
    .expect(Selector('.validation-list > .success').nth(0).withText(
      'Password must be greater than 10 characters.').exists).ok()
});
```

Update `validateForm()` to check whether the password has a length greater than 10:

```javascript
validateForm() {
  const rules = this.state.formRules;
  const formData = this.state.formData;
  rules[3].valid = false;
  if (formData.password.length > 10) rules[3].valid = true;
  this.setState({formRules: rules})
  if (this.allTrue()) this.setState({valid: true});
}
```

Then add the helper:

```javascript
allTrue() {
  for (const rule of this.state.formRules) {
    if (!rule.valid) return false;
  }
  return true;
}
```

This simply iterates through all the rules and returns `true` only if they are all valid. Then, to conditionally apply the CSS, update the `FormErrors` component:

```javascript
const FormErrors = (props) => {
  return (
    <div>
      <ul className="validation-list">
        {
          // eslint-disable-next-line
          props.rules.map((rule) => {
            if (rule.field === 'username') {
              if (props.formType === 'register') {
                return <li
                  className={rule.valid ? "success" : "error"} key={rule.id}>{rule.name}
                </li>
              }
            } else {
              return <li
                className={rule.valid ? "success" : "error"} key={rule.id}>{rule.name}
              </li>
            }
          })
        }
      </ul>
    </div>
  )
}
```

Update the containers, and then run the tests. Before moving on, we need to update the `componentWillReceiveProps` method, to reset the `rules` on a route change. Why is this necessary? Let's look. Update the test:

```javascript
test(`should validate the password field`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/login`)
    .expect(Selector('H1').withText('Login').exists).ok()
    .expect(Selector('form').exists).ok()
    .expect(Selector('input[disabled]').exists).ok()
    .expect(Selector('.validation-list > .error').nth(2).withText(
      'Password must be greater than 10 characters.').exists).ok()
    .typeText('input[name="password"]', 'greaterthanten')
    .expect(Selector('.validation-list').exists).ok()
    .expect(Selector('.validation-list > .error').nth(2).withText(
      'Password must be greater than 10 characters.').exists).notOk()
    .expect(Selector('.validation-list > .success').nth(0).withText(
      'Password must be greater than 10 characters.').exists).ok()
    .click(Selector('a').withText('Register'))
    .expect(Selector('.validation-list > .error').nth(3).withText(
      'Password must be greater than 10 characters.').exists).ok()
});
```

Add a method to update the value of `valid` to `false` for all rules:

```javascript
initRules() {
  const rules = this.state.formRules;
  for (const rule of rules) {
    rule.valid = false;
  }
  this.setState({formRules: rules})
}
```


Then call it:

```javascript
componentWillReceiveProps(nextProps) {
  if (this.props.formType !== nextProps.formType) {
    this.clearForm();
    this.initRules();
  }
}
```

Re-build the containers. Test again. Now, we just need to apply that same logic to the remaining fields...

#### <span style="font-family:'Montserrat', 'sans-serif';">Validate Inputs</span>

First, add a password to the top of *login.test.js*, *register.test.js*, and *status.test.js*:

```javascript
const password = 'greaterthanten';
```

Change `.typeText('input[name="password"]', 'test')` to `.typeText('input[name="password"]', password)` in those same files, and then run the tests to ensure they still properly fail.

Update `validateForm()`:

```javascript
validateForm() {
  const formType = this.props.formType;
  const rules = this.state.formRules;
  const formData = this.state.formData;
  this.setState({valid: false});
  for (const rule of rules) {
    rule.valid = false;
  }
  if (formType === 'register') {
    if (formData.username.length > 5) rules[0].valid = true;
  }
  if (formType === 'login') rules[0].valid = true;
  if (formData.email.length > 5) rules[1].valid = true;
  if (this.validateEmail(formData.email)) rules[2].valid = true;
  if (formData.password.length > 10) rules[3].valid = true;
  this.setState({formRules: rules})
  if (this.allTrue()) this.setState({valid: true});
}
```

Add the following [regular expression](https://stackoverflow.com/a/46181/1799408) to validate the email address:

```javascript
validateEmail(email) {
  // eslint-disable-next-line
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
```

Re-build. Test. Commit your code.
