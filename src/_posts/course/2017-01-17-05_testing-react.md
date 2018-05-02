---
title: Testing React
layout: post
permalink: part-two-testing-react
intro: false
part: 2
lesson: 5
share: true
---

Let's look at testing React components...

---

Create React App uses [Jest](https://facebook.github.io/jest/), a JavaScript test runner, by [default](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#running-tests), so we can start writing test specs. You will need to install the [jest-cli](https://www.npmjs.com/package/jest-cli) - in the "client" folder - to run the actual tests, though:

```sh
$ npm install jest-cli@20.0.4 --save-dev
```

Along with Jest, we'll use [Enzyme](https://github.com/airbnb/enzyme), a fantastic utility library made specifically for testing React components.

Install it as well enzyme-adapter-react-16:

```sh
$ npm install --save-dev enzyme@3.1.0 enzyme-adapter-react-16@1.0.2
```

To configure the Enzyme to use the React 16 adapter, add a new file to "src" called *setupTests.js*:

```javascript
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
```

> For more on setting up Enzyme, review the [official docs](http://airbnb.io/enzyme/#installation).

With that, run the tests:

```sh
$ npm test
```

You should see:

```sh
No tests found related to files changed since last commit.
```

By default, the tests run in [watch](http://facebook.github.io/jest/docs/en/cli.html#watch) mode, so the tests will re-run every time you save a file.

### Testing Components

Create a new file in "components" called *UsersList.test.js*:

```javascript
import React from 'react';
import { shallow } from 'enzyme';

import UsersList from '../UsersList';

const users = [
  {
    'active': true,
    'email': 'michael@realpython.com',
    'id': 1,
    'username': 'michael'
  },
  {
    'active': true,
    'email': 'michael@mherman.org',
    'id': 2,
    'username': 'michaelherman'
  }
]

test('UsersList renders properly', () => {
  const wrapper = shallow(<UsersList users={users}/>);
  const element = wrapper.find('h4');
  expect(element.length).toBe(2);
  expect(element.get(0).props.className).toBe('well');
  expect(element.get(0).props.children).toBe('michael');
});
```

In this test, we use the [shallow](http://airbnb.io/enzyme/docs/api/shallow.html) helper method to create the `UsersList` component and then we can retrieve the output and make assertions on it. It's important to note that with "[shallow rendering](https://reactjs.org/docs/shallow-renderer.html)", we can test the component in complete isolation, which helps to ensure child components do not indirectly affect assertions.

> For more on shallow rendering, along with the other methods of rendering components for testing (`mount` and `render`) see [this](https://stackoverflow.com/a/38747914/1799408) Stack Overflow article.

Run the test to ensure it passes.

### Snapshot Testing

Once the test is green, we'll then add a [Snapshot](http://facebook.github.io/jest/docs/en/snapshot-testing.html) test to ensure the UI does not change.

Add the following test to *UsersList.test.js*:

```javascript
test('UsersList renders a snapshot properly', () => {
  const tree = renderer.create(<UsersList users={users}/>).toJSON();
  expect(tree).toMatchSnapshot();
});
```

Add the import to the top:

```javascript
import renderer from 'react-test-renderer';
```

Run the tests. So, on the first test run, a snapshot is saved of the component output (to the "\_\_snapshots\_\_" folder). Then, during subsequent test runs, the new output is compared to the saved output. The test fails if they differ.

With the tests in watch mode, change `{user.username}` to `{user.email}` in the `UsersList` component. Save the changes to trigger a new test run. You should see both tests failing, which is exactly what we want. Now, if this change is intentional, you need to [update the snapshot](http://facebook.github.io/jest/docs/en/snapshot-testing.html#updating-snapshots). To do so, you just need to press the `u` key:

```sh
Watch Usage
 › Press a to run all tests.
 › Press u to update failing snapshots.
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit watch mode.
 › Press Enter to trigger a test run.
```

Try it out - press `u`. The tests will run again and the snapshot test should pass.

Once done, revert the changes we just made in the component, update the tests, ensure they pass, add the `__snapshots__` folder to the *.gitignore* file, and then commit your code.

### Test Coverage

Curious about test coverage?

```sh
$ react-scripts test --coverage
```

### Testing Interactions

Enzyme can also be used to test user interactions in terms of events. We can [simulate](http://airbnb.io/enzyme/docs/api/ReactWrapper/simulate.html) such actions and events and then test that the actual results are the same as the expected results. We'll look at this in a future lesson.

> It's worth noting that we'll focus much of our React testing on unit testing the individual components. We'll let the end-to-end tests handle testing user interaction as well as the interaction between the client and server.  

### `requestAnimationFrame` polyfill error

Do you get this error when your tests run?

```sh
console.error node_modules/fbjs/lib/warning.js:33
    Warning: React depends on requestAnimationFrame. Make sure that you load a polyfill in older browsers. http://fb.me/react-polyfills
```

If so, add a new folder to "services/client/src/components" called "\_\_mocks\_\_", and then add a file to that folder called *react.js*:

```javascript
const react = require('react');
// Resolution for requestAnimationFrame not supported in jest error :
// https://github.com/facebook/react/issues/9102#issuecomment-283873039
global.window = global;
window.addEventListener = () => {};
window.requestAnimationFrame = () => {
  throw new Error('requestAnimationFrame is not supported in Node');
};

module.exports = react;
```

Review the comment on [GitHub](https://github.com/facebook/react/issues/9102#issuecomment-283873039) for more info.
