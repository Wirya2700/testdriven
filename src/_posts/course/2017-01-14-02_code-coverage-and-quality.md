---
title: Code Coverage and Quality
layout: post
permalink: part-two-code-coverage-and-quality
intro: false
part: 2
lesson: 2
share: true
---

In this lesson, we'll add code coverage via [Coverage.py](http://coverage.readthedocs.io/en/coverage-4.4.1/) to the project...

---

Start by setting `testdriven-dev` as the active Docker Machine:

```sh
$ docker-machine env testdriven-dev
$ eval $(docker-machine env testdriven-dev)
```

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d
```

Ensure the app is working in the browser, and then run the tests:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py test
```

### Code Coverage

[Code coverage](https://en.wikipedia.org/wiki/Code_coverage) is the process of finding areas of your code not exercised by tests. Keep in mind that this does not measure the overall effectiveness of the test suite.

Add Coverage.py to the *requirements.txt* file in the "users-service" directory:

```
coverage==4.4.1
```

Next, we need to configure the coverage reports in *manage.py*. Start by adding the configuration right after the imports:

```python
COV = coverage.coverage(
    branch=True,
    include='project/*',
    omit=[
        'project/tests/*'
    ]
)
COV.start()
```

Then add the new manager command:

```python
@manager.command
def cov():
    """Runs the unit tests with coverage."""
    tests = unittest.TestLoader().discover('project/tests')
    result = unittest.TextTestRunner(verbosity=2).run(tests)
    if result.wasSuccessful():
        COV.stop()
        COV.save()
        print('Coverage Summary:')
        COV.report()
        COV.html_report()
        COV.erase()
        return 0
    return 1
```

Don't forget the import!

```python
import coverage
```

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d --build
```

Run the tests with coverage:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py cov
```

You should see something like:

```sh
Coverage Summary:
Name                    Stmts   Miss Branch BrPart  Cover
---------------------------------------------------------
project/__init__.py        12      5      0      0    58%
project/api/models.py      12      9      0      0    25%
project/api/users.py       48      0     10      0   100%
project/config.py          16      0      0      0   100%
---------------------------------------------------------
TOTAL                      88     14     10      0    86%
```

The HTML version can be viewed within the newly created "htmlcov" directory. Now you can quickly see which parts of the code are, and are not, covered by a test.

Add this directory to the *.gitignore* file.

### Code Quality

[Liniting](https://stackoverflow.com/a/8503586/1799408) is the process of checking your code for stylistic or programming errors. Although there are a [number](https://stackoverflow.com/a/7925369/1799408) of commonly used linters for Python, we'll use [Flake8](https://gitlab.com/pycqa/flake8) since it combines two other popular linters - [pep8](https://pypi.python.org/pypi/pep8) and [pyflakes](https://pypi.python.org/pypi/pyflakes).

Add flake8 to the *requirements.txt* file in the "users-service" directory:

```
flake8===3.4.1
```

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d --build
```

Run flake8:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service flake8 project
```

Were any errors found?

```sh
project/__init__.py:7:1: F401 'flask.jsonify' imported but unused
project/tests/test_users.py:60:80: E501 line too long (85 > 79 characters)
```

Correct any issues before moving on. Commit your code, and push it to GitHub.
