---
title: Update Component
layout: post
permalink: part-three-update-component
intro: false
part: 3
lesson: 12
share: true
---

In this lesson, we'll refactor the `UsersList` and `UserStatus` components...

---

### Docker Machine

Set `testdriven-dev` as the active Docker Machine:

```sh
$ docker-machine env testdriven-dev
$ eval $(docker-machine env testdriven-dev)
```

Ensure the app is working in the browser, and then run the tests:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py test

$ docker-compose -f docker-compose-dev.yml \
  run users-service flake8 project

$ docker-compose -f docker-compose-dev.yml \
  run client npm test -- --verbose
```

### UsersList

Let's remove the add user form and display a Bootstrap-styled table of users...

#### Remove the form

To remove the form, update *UsersList.jsx*:

```javascript
import React from 'react';

const UsersList = (props) => {
  return (
    <div>
      <h1>All Users</h1>
      <hr/><br/>
      {
        props.users.map((user) => {
          return (
            <h4
              key={user.id}
              className="well"
            >{user.username}
            </h4>
          )
        })
      }
    </div>
  )
};

export default UsersList;
```

Update the route in the `App` component:

```javascript
<Route exact path='/' render={() => (
  <UsersList
    users={this.state.users}
  />
)} />
```

Make sure to remove the `AddUser` import at the top of the file, and then test it out in the browser:

<div style="text-align:left;">
  <img src="/assets/img/course/03_react_refactor.png" style="max-width: 100%; border:0; box-shadow: none;" alt="react component refactor">
</div>

What about the tests?

```sh
$ docker-compose -f docker-compose-dev.yml \
  run client npm test -- --verbose
```

You should see the snapshot test fail:

```sh
✕ UsersList renders a snapshot properly
```

It should also spit out the diff to the terminal:

```sh
FAIL  src/components/__tests__/UsersList.test.js
 ● UsersList renders a snapshot properly

   expect(value).toMatchSnapshot()

   Received value does not match stored snapshot 1.

   - Snapshot
   + Received

   @@ -1,6 +1,11 @@
    <div>
   +  <h1>
   +    All Users
   +  </h1>
   +  <hr />
   +  <br />
      <h4
        className="well"
      >
        michael
      </h4>
```

Since this is expected, update the snapshot by pressing the `u` key:

```sh
Watch Usage
 › Press a to run all tests.
 › Press u to update failing snapshots.
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit watch mode.
 › Press Enter to trigger a test run.
```

All tests should now pass. Before moving on, since `<h1>All Users</h1>` is now part of the `UsersList` component, let's update the unit test:

```javascript
test('UsersList renders properly', () => {
  const wrapper = shallow(<UsersList users={users}/>);
  const element = wrapper.find('h4');
  expect(wrapper.find('h1').get(0).props.children).toBe('All Users');
  expect(element.length).toBe(2);
  expect(element.get(0).props.className).toBe('well');
  expect(element.get(0).props.children).toBe('michael');
});
```

#### Add table

Next, let's use React-Bootstrap to add a [table](https://react-bootstrap.github.io/components/table/) to the `UsersList` component:

```javascript
import React from 'react';
import { Table } from 'react-bootstrap';

const UsersList = (props) => {
  return (
    <div>
      <h1>All Users</h1>
      <hr/><br/>
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Username</th>
            <th>Active</th>
            <th>Admin</th>
          </tr>
        </thead>
        <tbody>
          {
            props.users.map((user) => {
              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>{String(user.active)}</td>
                  <td>{String(user.admin)}</td>
                </tr>
              )
            })
          }
        </tbody>
      </Table>
    </div>
  )
};

export default UsersList;
```

The rendered component should now look like:

<div style="text-align:left;">
  <img src="/assets/img/course/03_react_refactor_users_table.png" style="max-width: 100%; border:0; box-shadow: none;" alt="react component refactor all users">
</div>

Update the test:

```javascript
test('UsersList renders properly', () => {
  const wrapper = shallow(<UsersList users={users}/>);
  expect(wrapper.find('h1').get(0).props.children).toBe('All Users');
  // table
  const table = wrapper.find('Table');
  expect(table.length).toBe(1);
  expect(table.get(0).props.striped).toBe(true);
  expect(table.get(0).props.bordered).toBe(true);
  expect(table.get(0).props.condensed).toBe(true);
  expect(table.get(0).props.hover).toBe(true);
  // table head
  expect(wrapper.find('thead').length).toBe(1);
  const th = wrapper.find('th');
  expect(th.length).toBe(5);
  expect(th.get(0).props.children).toBe('User ID');
  expect(th.get(1).props.children).toBe('Email');
  expect(th.get(2).props.children).toBe('Username');
  expect(th.get(3).props.children).toBe('Active');
  expect(th.get(4).props.children).toBe('Admin');
  // table body
  expect(wrapper.find('tbody').length).toBe(1);
  expect(wrapper.find('tbody > tr').length).toBe(2);
  const td = wrapper.find('tbody > tr > td');
  expect(td.length).toBe(10);
  expect(td.get(0).props.children).toBe(1);
  expect(td.get(1).props.children).toBe('michael@realpython.com');
  expect(td.get(2).props.children).toBe('michael');
  expect(td.get(3).props.children).toBe('true');
  expect(td.get(4).props.children).toBe('false');
});
```

Make sure to update the fixture as well:

```javascript
const users = [
  {
    'active': true,
    'admin': false,
    'email': 'michael@realpython.com',
    'id': 1,
    'username': 'michael'
  },
  {
    'active': true,
    'admin': false,
    'email': 'michael@mherman.org',
    'id': 2,
    'username': 'michaelherman'
  }
]
```

Run the tests, making sure to update the snapshot test again:

```sh
Snapshot Summary
 › 1 snapshot updated in 1 test suite.

Test Suites: 7 passed, 7 total
Tests:       19 passed, 19 total
Snapshots:   1 updated, 6 passed, 7 total
Time:        5.178s, estimated 10s
Ran all test suites.
```

### UserStatus

Next, let's add the `active` and `admin` properties to the `UserStatus` component:

```javascript
class UserStatus extends Component {
  constructor (props) {
    super(props);
    this.state = {
      email: '',
      id: '',
      username: '',
      active: '',
      admin: ''
    };
  };
  componentDidMount() {
    if (this.props.isAuthenticated) {
      this.getUserStatus();
    };
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
    .then((res) => {
      this.setState({
        email: res.data.data.email,
        id: res.data.data.id,
        username: res.data.data.username,
        active: String(res.data.data.active),
        admin: String(res.data.data.admin),
      })
    })
    .catch((error) => { console.log(error); });
  };
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
          <li><strong>Active:</strong> {this.state.active}</li>
          <li><strong>Admin:</strong> {this.state.admin}</li>
        </ul>
      </div>
    )
  };
};
```

> We'll look at how to test this one in a future lesson.

That's it. Short lesson. Make sure the tests still pass.

```sh
Test Suites: 7 passed, 7 total
Tests:       19 passed, 19 total
Snapshots:   7 passed, 7 total
Time:        9.111s
Ran all test suites.
```

Commit you code.

> You may have noticed that we are not handling errors on the client. We'll tackle that in an upcoming lesson!
