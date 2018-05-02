---
title: Mocking User Interaction
layout: post
permalink: part-three-mocking-user-interaction
intro: false
part: 3
lesson: 9
share: true
---

Let's look at how to test user interactions with Enzyme...

---

When testing components, especially users interactions, pay close attention to both the inputs and outputs:

1. Inputs - props, state, user interactions
1. Output - what the component renders

So, given the `Form` component, for the register route, what are the inputs:

1. `formType={'Register'}`
1. `formData={this.state.formData}`
1. `handleUserFormSubmit={this.handleUserFormSubmit}`
1. `handleFormChange={this.handleFormChange}`
1. `isAuthenticated={this.state.isAuthenticated}`

What happens when a user submits the registration form correctly? What does the component render? Does the component behave differently based on the provided inputs? What would change if the value of `formType` was `Login`?

### Refactor

Let's start by refactoring the current tests in *services/client/src/components/\_\_tests\_\_/Form.test.js*:

```javascript
describe('When not authenticated', () => {
  testData.forEach((el) => {
    const component = <Form
      formType={el.formType}
      formData={el.formData}
      isAuthenticated={false}
    />;
    it(`${el.formType} Form renders properly`, () => {
      const wrapper = shallow(component);
      const h1 = wrapper.find('h1');
      expect(h1.length).toBe(1);
      expect(h1.get(0).props.children).toBe(el.formType);
      const formGroup = wrapper.find('.form-group');
      expect(formGroup.length).toBe(Object.keys(el.formData).length);
      expect(formGroup.get(0).props.children.props.name).toBe(Object.keys(el.formData)[0]);
      expect(formGroup.get(0).props.children.props.value).toBe('');
    });
    it(`${el.formType} Form renders a snapshot properly`, () => {
      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
    });
  })
});
```

Run the tests with the `--verbose` flag so we can see the full output:

```sh
docker-compose -f docker-compose-dev.yml \
  run client npm test -- --verbose
```

You should see something similar to:


```sh
PASS  src/components/__tests__/App.test.js
 ✓ App renders without crashing (8ms)

PASS  src/components/__tests__/NavBar.test.js
 ✓ NavBar renders properly (8ms)
 ✓ NavBar renders a snapshot properly (14ms)

PASS  src/components/__tests__/UsersList.test.js
 ✓ UsersList renders properly (4ms)
 ✓ UsersList renders a snapshot properly (11ms)

PASS  src/components/__tests__/Form.test.js
 When not authenticated
   ✓ Register Form renders properly (11ms)
   ✓ Register Form renders a snapshot properly (3ms)
   ✓ Login Form renders properly (2ms)
   ✓ Login Form renders a snapshot properly (1ms)

PASS  src/components/__tests__/Logout.test.js
 ✓ Logout renders properly (4ms)
 ✓ Logout renders a snapshot properly (4ms)

PASS  src/components/__tests__/AddUser.test.js
 ✓ AddUser renders properly (5ms)
 ✓ AddUser renders a snapshot properly (3ms)

PASS  src/components/__tests__/About.test.js
 ✓ About renders properly (3ms)
 ✓ About renders a snapshot properly (2ms)

Test Suites: 7 passed, 7 total
Tests:       15 passed, 15 total
Snapshots:   7 passed, 7 total
Time:        3.662s, estimated 4s
Ran all test suites.
```

Now, turn back to the component. What will happen if `isAuthenticated` is `true`? Will this cause the component to behave differently?

Need a hint?

```javascript
if (props.isAuthenticated) {
  return <Redirect to='/' />;
}
```

Add a another set of test cases:

```javascript
describe('When authenticated', () => {
  testData.forEach((el) => {
    const component = <Form
      formType={el.formType}
      formData={el.formData}
      isAuthenticated={true}
    />;
    it(`${el.formType} redirects properly`, () => {
      const wrapper = shallow(component);
      expect(wrapper.find('Redirect')).toHaveLength(1);
    });
  })
});
```

For this test case, we're just asserting that the `Render` component is rendered. Ensure the tests pass.

```sh
Test Suites: 7 passed, 7 total
Tests:       17 passed, 17 total
Snapshots:   7 passed, 7 total
Time:        8.226s
Ran all test suites.
```

Next, let's look at how to test a user interaction...

### Testing Interactions

Before we start, brainstorm on your on for a bit on what happens during a form submit, paying particular attention to the component's inputs and outputs...

#### Form Submit

Add a new `describe` block to *services/client/src/components/\_\_tests\_\_/Form.test.js*:

```javascript
describe('When not authenticated', () => {
  const testValues = {
    formType: 'Register',
    formData: {
      username: '',
      email: '',
      password: ''
    },
    handleUserFormSubmit: jest.fn(),
    handleFormChange: jest.fn(),
    isAuthenticated: false,
  };
  const component = <Form {...testValues} />;
  it(`${testValues.formType} Form submits the form properly`, () => {
    const wrapper = shallow(component);
    expect(testValues.handleUserFormSubmit).toHaveBeenCalledTimes(0);
    wrapper.find('form').simulate('submit')
    expect(testValues.handleUserFormSubmit).toHaveBeenCalledTimes(1);
  });
});
```

Here, we used `jest.fn()` to [mock](http://facebook.github.io/jest/docs/en/mock-function-api.html#mockfnmockimplementationfn) the `handleUserFormSubmit` method and then asserted that the function was called on the [simulated](http://airbnb.io/enzyme/docs/api/ShallowWrapper/simulate.html) form submit.

#### Form Values

Let's take it one step further and assert that the form values are being handled correctly. Update the `it` block like so:

```javascript
it(`${testValues.formType} Form submits the form properly`, () => {
  const wrapper = shallow(component);
  expect(testValues.handleUserFormSubmit).toHaveBeenCalledTimes(0);
  wrapper.find('form').simulate('submit', testValues.formData)
  expect(testValues.handleUserFormSubmit).toHaveBeenCalledWith(
    testValues.formData);
  expect(testValues.handleUserFormSubmit).toHaveBeenCalledTimes(1);
});
```

#### OnChange

How about the `onChange`?


```javascript
it(`${testValues.formType} Form submits the form properly`, () => {
  const wrapper = shallow(component);
  const input = wrapper.find('input[type="text"]');
  expect(testValues.handleUserFormSubmit).toHaveBeenCalledTimes(0);
  expect(testValues.handleFormChange).toHaveBeenCalledTimes(0);
  input.simulate('change')
  expect(testValues.handleFormChange).toHaveBeenCalledTimes(1);
  wrapper.find('form').simulate('submit', testValues.formData)
  expect(testValues.handleUserFormSubmit).toHaveBeenCalledWith(
    testValues.formData);
  expect(testValues.handleUserFormSubmit).toHaveBeenCalledTimes(1);
});
```

#### Refactor

Finally, update the tests to incorporate the previous `it` block into the original describe `block`:

```javascript
import React from 'react';
import { shallow, simulate } from 'enzyme';
import renderer from 'react-test-renderer';
import { MemoryRouter, Switch, Redirect } from 'react-router-dom';

import Form from '../Form';

const testData = [
  {
    formType: 'Register',
    formData: {
      username: '',
      email: '',
      password: ''
    },
    handleUserFormSubmit: jest.fn(),
    handleFormChange: jest.fn(),
    isAuthenticated: false,
  },
  {
    formType: 'Login',
    formData: {
      email: '',
      password: ''
    },
    handleUserFormSubmit: jest.fn(),
    handleFormChange: jest.fn(),
    isAuthenticated: false,
  }
]

describe('When not authenticated', () => {
  testData.forEach((el) => {
    const component = <Form {...el} />;
    it(`${el.formType} Form renders properly`, () => {
      const wrapper = shallow(component);
      const h1 = wrapper.find('h1');
      expect(h1.length).toBe(1);
      expect(h1.get(0).props.children).toBe(el.formType);
      const formGroup = wrapper.find('.form-group');
      expect(formGroup.length).toBe(Object.keys(el.formData).length);
      expect(formGroup.get(0).props.children.props.name).toBe(
        Object.keys(el.formData)[0]);
      expect(formGroup.get(0).props.children.props.value).toBe('');
    });
    it(`${el.formType} Form submits the form properly`, () => {
      const wrapper = shallow(component);
      const input = wrapper.find('input[type="email"]');
      expect(el.handleUserFormSubmit).toHaveBeenCalledTimes(0);
      expect(el.handleFormChange).toHaveBeenCalledTimes(0);
      input.simulate('change')
      expect(el.handleFormChange).toHaveBeenCalledTimes(1);
      wrapper.find('form').simulate('submit', el.formData)
      expect(el.handleUserFormSubmit).toHaveBeenCalledWith(el.formData);
      expect(el.handleUserFormSubmit).toHaveBeenCalledTimes(1);
    });
    it(`${el.formType} Form renders a snapshot properly`, () => {
      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
    });
  })
});

describe('When authenticated', () => {
  testData.forEach((el) => {
    const component = <Form
      formType={el.formType}
      formData={el.formData}
      isAuthenticated={true}
    />;
    it(`${el.formType} redirects properly`, () => {
      const wrapper = shallow(component);
      expect(wrapper.find('Redirect')).toHaveLength(1);
    });
  })
});
```

Insure the tests pass before moving on:

```sh
PASS  src/components/__tests__/NavBar.test.js
 ✓ NavBar renders properly (5ms)
 ✓ NavBar renders a snapshot properly (17ms)

PASS  src/components/__tests__/App.test.js
 ✓ App renders without crashing (8ms)

PASS  src/components/__tests__/Form.test.js
 When not authenticated
   ✓ Register Form renders properly (5ms)
   ✓ Register Form submits the form properly (2ms)
   ✓ Register Form renders a snapshot properly (5ms)
   ✓ Login Form renders properly (1ms)
   ✓ Login Form submits the form properly (2ms)
   ✓ Login Form renders a snapshot properly (3ms)
 When authenticated
   ✓ Register redirects properly (2ms)
   ✓ Login redirects properly (1ms)

PASS  src/components/__tests__/Logout.test.js
 ✓ Logout renders properly (3ms)
 ✓ Logout renders a snapshot properly (18ms)

PASS  src/components/__tests__/AddUser.test.js
 ✓ AddUser renders properly (14ms)
 ✓ AddUser renders a snapshot properly (5ms)

PASS  src/components/__tests__/About.test.js
 ✓ About renders properly (3ms)
 ✓ About renders a snapshot properly (3ms)

PASS  src/components/__tests__/UsersList.test.js
 ✓ UsersList renders properly (3ms)
 ✓ UsersList renders a snapshot properly (4ms)

Test Suites: 7 passed, 7 total
Tests:       19 passed, 19 total
Snapshots:   7 passed, 7 total
Time:        4.003s, estimated 10s
Ran all test suites.
```

Commit and push your code.
