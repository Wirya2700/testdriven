---
title: Update Component
layout: post
date: 2017-06-20 23:59:58
permalink: part-three-update-component
intro: false
part: 3
lesson: 10
share: true
---

In this lesson, we'll refactor the `UsersList` component to remove the add user form and display a Bootstrap-styled table of users...

---

In the terminal, navigate to the *flask-microservices-users* project, activate a virtual environment, and then run the Flask server:

```sh
(env)$ python manage.py runserver
```

Then, in a new terminal window, navigate to the *flask-microservices-client* project, set the environment variable, and run the React app:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1:5000
$ npm start
```

Make sure all is well!

#### <span style="font-family:'Montserrat', 'sans-serif';">Remove Form</span>

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
          return <h4 key={user.id} className="well"><strong>{user.username}</strong> - <em>{user.created_at}</em></h4>
        })
      }
    </div>
  )
}

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

Make sure to remove the `AddUser` import at the top of the file, and then test it out.

#### <span style="font-family:'Montserrat', 'sans-serif';">Table</span>

Next, let's use React-Bootstrap to add a [table](https://react-bootstrap.github.io/components.html#tables) in the `UsersList` component:

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
            <th>Created Date</th>
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
                  <td>{user.created_at}</td>
                </tr>
              )
            })
          }
        </tbody>
      </Table>
    </div>
  )
}

export default UsersList;
```

That's it. Short lesson. Commit you code.

> You may have noticed that we are not handling errors on the client. We'll tackle that in the part 4!
