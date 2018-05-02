---
title: Getting Started
layout: post
permalink: part-one-getting-started
intro: false
part: 1
lesson: 4
share: true
---

In this lesson, we'll set up the base project structure and define the first service...

---

Create a new project and install Flask:

```sh
$ mkdir testdriven-app && cd testdriven-app
$ mkdir users-service && cd users-service
$ mkdir project
$ python3.6 -m venv env
$ source env/bin/activate
(env)$ pip install flask==0.12.2
```

Add an *\_\_init\_\_.py* file to the "project" directory and configure the first route:

```python
# users-service/project/__init__.py


from flask import Flask, jsonify


# instantiate the app
app = Flask(__name__)


@app.route('/users/ping', methods=['GET'])
def ping_pong():
    return jsonify({
        'status': 'success',
        'message': 'pong!'
    })
```

Next, let's configure [Flask Script](https://flask-script.readthedocs.io/en/latest/) to run and manage the app from the command line:

```sh
(env)$ pip install flask-script==2.0.5
```

> Since Flask Script is [depreciated](https://github.com/smurfix/flask-script/issues/172), you are more than welcome to use the [Flask CLI](http://flask.pocoo.org/docs/0.12/cli/) in its place. Review the following [article](https://stackoverflow.com/questions/42754341/use-flasks-click-cli-with-the-app-factory-pattern) for more info.

Add a *manage.py* file to the "users-service" directory:

```python
# users-service/manage.py


from flask_script import Manager

from project import app


manager = Manager(app)


if __name__ == '__main__':
    manager.run()
```

Here, we created a new `Manager` instance to handle all of the manager commands from the command line.

Run the server:

```sh
(env)$ python manage.py runserver
```

Navigate to [http://localhost:5000/users/ping](http://localhost:5000/users/ping) in your browser. You should see:

```json
{
  "message": "pong!",
  "status": "success"
}
```

Kill the server and add a new file called *config.py* to the "project" directory:

```python
# users-service/project/config.py


class BaseConfig:
    """Base configuration"""
    DEBUG = False
    TESTING = False


class DevelopmentConfig(BaseConfig):
    """Development configuration"""
    DEBUG = True


class TestingConfig(BaseConfig):
    """Testing configuration"""
    DEBUG = True
    TESTING = True


class ProductionConfig(BaseConfig):
    """Production configuration"""
    DEBUG = False
```

Update *\_\_init\_\_.py* to pull in the dev config on init:

```python
# users-service/project/__init__.py


from flask import Flask, jsonify


# instantiate the app
app = Flask(__name__)

# set config
app.config.from_object('project.config.DevelopmentConfig')


@app.route('/users/ping', methods=['GET'])
def ping_pong():
    return jsonify({
        'status': 'success',
        'message': 'pong!'
    })
```

Run the app again. This time, [debug mode](http://flask.pocoo.org/docs/0.12/quickstart/#debug-mode) should be on:

```sh
$ python manage.py runserver
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 107-952-069
```

Now when you make changes to the code, the app will automatically reload. Once done, kill the server and deactivate from the virtual environment. Then, add a *requirements.txt* file to the "users-service" directory:

```
Flask==0.12.1
Flask-Script==2.0.5
```

Finally, add a *.gitignore*, to the project root:

```
__pycache__
env
```

Init a git repo and commit your code to GitHub.
