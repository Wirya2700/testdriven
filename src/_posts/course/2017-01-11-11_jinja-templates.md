---
title: Jinja Templates
layout: post
permalink: part-one-jinja-templates
intro: false
part: 1
lesson: 11
share: true
---

Instead of just serving up a JSON API, let's spice it up with server-side templates...

---

Add a new route handler to *users-service/project/api/users.py*:

```python
@users_blueprint.route('/', methods=['GET'])
def index():
    return render_template('index.html')
```

Update the Blueprint config as well:

```python
users_blueprint = Blueprint('users', __name__, template_folder='./templates')
```

Then add a "templates" folder to "project/api", and add an *index.html* file to that folder:

{% raw %}
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Flask on Docker</title>
    <!-- meta -->
    <meta name="description" content="">
    <meta name="author" content="">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- styles -->
    <link
      href="//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css"
      rel="stylesheet"
    >
    {% block css %}{% endblock %}
  </head>
  <body>
    <div class="container">
      <div class="row">
        <div class="col-md-4">
          <br>
          <h1>All Users</h1>
          <hr><br>
          <form action="/" method="POST">
            <div class="form-group">
              <input name="username" class="form-control input-lg" type="text" placeholder="Enter a username" required>
            </div>
            <div class="form-group">
              <input name="email" class="form-control input-lg" type="email" placeholder="Enter an email address" required>
            </div>
            <input type="submit" class="btn btn-primary btn-lg btn-block" value="Submit">
          </form>
          <br>
          <hr>
            {% if users %}
              <ol>
                {% for user in users %}
                  <li>{{user.username}}</li>
                {% endfor %}
              </ol>
            {% else %}
              <p>No users!</p>
            {% endif %}
          </div>
        </div>
      </div>
    </div>
    <!-- scripts -->
    <script
      type="text/javascript"
      src="//code.jquery.com/jquery-2.2.4.min.js"
    ></script>
    <script
      type="text/javascript"
      src="//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/js/bootstrap.min.js"
    >
    </script>
    {% block js %}{% endblock %}
  </body>
</html>
```
{% endraw %}

Be sure to update the imports:

```python
from flask import Blueprint, jsonify, request, render_template
```

Ready to test? Simply open your browser and navigate to the IP associated with the `testdriven-dev` machine.

<div style="text-align:left;">
  <img src="/assets/img/course/01_bootstrap.png" style="max-width: 100%; border:0; box-shadow: none;" alt="flask app">
</div>

How about a test?

```python
def test_main_no_users(self):
    """Ensure the main route behaves correctly when no users have been
    added to the database."""
    response = self.client.get('/')
    self.assertEqual(response.status_code, 200)
    self.assertIn(b'<h1>All Users</h1>', response.data)
    self.assertIn(b'<p>No users!</p>', response.data)
```

Do they pass?

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py test
```

Let's update the route handler to grab all users from the database and send them to the template, starting with a test:

```python
def test_main_with_users(self):
    """Ensure the main route behaves correctly when users have been
    added to the database."""
    add_user('michael', 'michael@realpython.com')
    add_user('fletcher', 'fletcher@realpython.com')
    with self.client:
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<h1>All Users</h1>', response.data)
        self.assertNotIn(b'<p>No users!</p>', response.data)
        self.assertIn(b'michael', response.data)
        self.assertIn(b'fletcher', response.data)
```

Make sure it fails, and then update the view:

```python
@users_blueprint.route('/', methods=['GET'])
def index():
    users = User.query.all()
    return render_template('index.html', users=users)
```

The test should now pass!

How about the form? Users should be able to add a new user and submit the form, which will then add the user to the database. Again, start with a test:

```python
def test_main_add_user(self):
    """Ensure a new user can be added to the database."""
    with self.client:
        response = self.client.post(
            '/',
            data=dict(username='michael', email='michael@realpython.com'),
            follow_redirects=True
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<h1>All Users</h1>', response.data)
        self.assertNotIn(b'<p>No users!</p>', response.data)
        self.assertIn(b'michael', response.data)
```

Then update the view:

```python
@users_blueprint.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        db.session.add(User(username=username, email=email))
        db.session.commit()
    users = User.query.all()
    return render_template('index.html', users=users)
```

Finally, let's update the code on AWS.

1. `eval $(docker-machine env testdriven-prod)`
1. `docker-compose -f docker-compose-prod.yml up -d --build`
1. Test:
  - [http://DOCKER_MACHINE_PROD_IP](http://DOCKER_MACHINE_PROD_IP)
  - [http://DOCKER_MACHINE_PROD_IP/users](http://DOCKER_MACHINE_PROD_IP/users)
