---
title: Getting Started
layout: post
date: 2017-05-11 23:59:58
permalink: part-one-getting-started
intro: false
part: 1
lesson: 2
share: true
---

In this lesson, we'll set up the base project structure and define the first service...

---

Create a new project and install Flask:

```sh
$ mkdir flask-microservices-users && cd flask-microservices-users
$ mkdir project
$ python3.6 -m venv env
$ source env/bin/activate
(env)$ pip install flask==0.12.2
```

Add an *\_\_init\_\_.py* file to the "project" directory and configure the first route:

```python
# project/__init__.py


from flask import Flask, jsonify


# instantiate the app
app = Flask(__name__)


@app.route('/ping', methods=['GET'])
def ping_pong():
    return jsonify({
        'status': 'success',
        'message': 'pong!'
    })
```

Next, add [Flask-Script](https://flask-script.readthedocs.io/en/latest/), which will be used to run and manage the app from the command line:

```sh
(env)$ pip install flask-script==2.0.5
```

Add a *manage.py* file to the project root:

```python
# manage.py


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

Navigate to [http://localhost:5000/ping](http://localhost:5000/ping) in your browser. You should see:

```json
{
  "message": "pong!",
  "status": "success"
}
```

Kill the server and add a new file called *config.py* to the "project" directory:

```python
# project/config.py


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
# project/__init__.py


from flask import Flask, jsonify


# instantiate the app
app = Flask(__name__)

# set config
app.config.from_object('project.config.DevelopmentConfig')


@app.route('/ping', methods=['GET'])
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

Now when you make changes to the code, the app will automatically reload. Once done, kill the server and deactivate from the virtual environment. Then, add a *requirements.txt* file to the root directory:

```
Flask==0.12.1
Flask-Script==2.0.5
```

Finally, add a *.gitignore*, to the project root as well:

```
__pycache__
env
```

Init a git repo and commit your code.
