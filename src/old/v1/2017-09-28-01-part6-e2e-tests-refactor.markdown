---
title: End-to-End Tests Refactor
layout: post
date: 2017-09-28 23:59:59
permalink: part-six-e2e-tests-refactor
intro: false
part: 6
lesson: 7
share: true
---

Let's quickly refactor our end-to-end test suite to match the changes we made to the client-side...

---

Start by running the tests:

```sh
$ sh test.sh
```

You should see five failing e2e tests:

1. `should display the page correctly if a user is not logged in`
1. `should display the sign in form`
1. `should validate the password field`
1. `should allow a user to sign in`
1. `should allow a user to register`

#### `should display the page correctly if a user is not logged in`

Update the URL from `/` to `/all-users`:

```javascript
import { Selector } from 'testcafe';

const TEST_URL = process.env.TEST_URL;

fixture('/all-users').page(`${TEST_URL}/all-users`);

test(`should display the page correctly if a user is not logged in`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/all-users`)
    .expect(Selector('H1').withText('All Users').exists).ok()
    .expect(Selector('a').withText('User Status').exists).notOk()
    .expect(Selector('a').withText('Log Out').exists).notOk()
    .expect(Selector('a').withText('Register').exists).ok()
    .expect(Selector('a').withText('Log In').exists).ok()
    .expect(Selector('.alert').exists).notOk()
});
```

Rename the file to *all-users.test.js* as well.

#### `should display the sign in form`

Update the validation error message:

```javascript
test(`should display the sign in form`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/login`)
    .expect(Selector('H1').withText('Login').exists).ok()
    .expect(Selector('form').exists).ok()
    .expect(Selector('input[disabled]').exists).ok()
    .expect(Selector('.validation-list').exists).ok()
    .expect(Selector('.validation-list > .error').nth(0).withText(
      'Email is required.').exists).ok()
});
```

#### `should validate the password field`

Again, update the validation messages:

```javascript
test(`should validate the password field`, async (t) => {
  await t
    .navigateTo(`${TEST_URL}/login`)
    .expect(Selector('H1').withText('Login').exists).ok()
    .expect(Selector('form').exists).ok()
    .expect(Selector('input[disabled]').exists).ok()
    .expect(Selector('.validation-list > .error').nth(1).withText(
      'Password is required.').exists).ok()
    .typeText('input[name="password"]', 'something')
    .expect(Selector('.validation-list').exists).ok()
    .expect(Selector('.validation-list > .error').nth(1).withText(
      'Password is required.').exists).notOk()
    .expect(Selector('.validation-list > .success').nth(0).withText(
      'Password is required.').exists).ok()
});
```

#### `should allow a user to sign in`

Navigate to `/all-users` after the redirect to `/`:

```javascript
test(`should allow a user to sign in`, async (t) => {

  // register user
  await t
    .navigateTo(`${TEST_URL}/register`)
    .typeText('input[name="username"]', username)
    .typeText('input[name="email"]', email)
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))

  // log a user out
  await t
    .click(Selector('a').withText('Log Out'))

  // log a user in
  await t
    .navigateTo(`${TEST_URL}/login`)
    .typeText('input[name="email"]', email)
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))

  // assert user is redirected to '/'
  // assert '/all-users' is displayed properly
  const tableRow = Selector('td').withText(username).parent();
  await t
    .expect(Selector('H1').withText('Exercises').exists).ok()
    .expect(Selector('.alert-success').withText('Welcome!').exists).ok()
    .navigateTo(`${TEST_URL}/all-users`)
    .expect(Selector('H1').withText('All Users').exists).ok()
    .expect(tableRow.child().withText(username).exists).ok()
    .expect(tableRow.child().withText(email).exists).ok()
    .expect(Selector('a').withText('User Status').exists).ok()
    .expect(Selector('a').withText('Log Out').exists).ok()
    .expect(Selector('a').withText('Register').exists).notOk()
    .expect(Selector('a').withText('Log In').exists).notOk()

  // log a user out
  await t
    .click(Selector('a').withText('Log Out'))

  // assert '/logout' is displayed properly
  await t
    .expect(Selector('p').withText('You are now logged out').exists).ok()
    .expect(Selector('a').withText('User Status').exists).notOk()
    .expect(Selector('a').withText('Log Out').exists).notOk()
    .expect(Selector('a').withText('Register').exists).ok()
    .expect(Selector('a').withText('Log In').exists).ok()

});
```

#### `should allow a user to register`

Same thing here:

```javascript
test(`should allow a user to register`, async (t) => {

  // register user
  await t
    .navigateTo(`${TEST_URL}/register`)
    .typeText('input[name="username"]', username)
    .typeText('input[name="email"]', email)
    .typeText('input[name="password"]', password)
    .click(Selector('input[type="submit"]'))

  // assert user is redirected to '/'
  // assert '/all-users' is displayed properly
  const tableRow = Selector('td').withText(username).parent();
  await t
    .expect(Selector('H1').withText('Exercises').exists).ok()
    .navigateTo(`${TEST_URL}/all-users`)
    .expect(Selector('H1').withText('All Users').exists).ok()
    .expect(tableRow.child().withText(username).exists).ok()
    .expect(tableRow.child().withText(email).exists).ok()
    .expect(Selector('a').withText('User Status').exists).ok()
    .expect(Selector('a').withText('Log Out').exists).ok()
    .expect(Selector('a').withText('Register').exists).notOk()
    .expect(Selector('a').withText('Log In').exists).notOk()

});
```

Add more tests as needed. Ensure they are all green before moving on.
