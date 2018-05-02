---
layout: post
title: Microservices with Docker, Flask, and React
---

<hr><br>

<p><em>Learn how to build, test, and deploy microservices powered by Docker, Flask, and React!</em></p>

In this course, you will learn how to quickly spin up a reproducible development environment with *Docker* to manage a number of *microservices*. Once the app is up and running locally, you'll learn how to deploy it to an *Amazon EC2* instance. Finally, we'll look at scaling the services on *Amazon EC2 Container Service (ECS)* and adding *AWS Lambda*.

We'll also be practicing test-driven development (TDD), writing tests first when it makes sense to do so. The focus will be on server-side unit, functional, and integration tests along with end-to-end tests to ensure the entire system works as expected.

"Code without tests is broken by design." - Jacob Kaplan-Moss

<div style="text-align:left;">
  <img src="/assets/img/course/03_flask-tdd-logo.png" style="max-width: 100%; border:0; box-shadow: none;" alt="flask tdd logo">
</div>

<div>
  <p><a class="waves-effect waves-light red darken-1 center-align btn-large" href="https://gum.co/flask">Purchase Now!</a></p>
  <p><a href="{{ site.url }}/part-one-intro">Or, preview parts 1 through 3</a></p>
</div>

(*Current version: 2.1, released on 12/22/2017*)

<a class="twitter-share-button" data-show-count="false" href="https://twitter.com/intent/tweet?text=Microservices%20with%20Docker,%20Flask,%20and%20React%20%23webdev&amp;url=https://testdriven.io&amp;via={{ site.twitter }}" rel="nofollow" target="_blank" title="Share on Twitter"></a><script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

<br><hr><br>

#### What will you build?

##### Services

1. *users* - Flask app for managing users and auth
1. *client* - client-side, React app
1. *nginx* - reverse proxy web server
1. *swagger* - Swagger API docs
1. *scores* - Flask app for managing user scores
1. *exercises* - Flask app for managing exercises

##### App

<div style="text-align:left;">
  <img src="/assets/img/course/07_testdriven.png" style="max-width: 100%; border:0; box-shadow: none;" alt="microservice architecture">
</div>

Check out the live app, running on multiple EC2 instances -

1. [Production](http://testdriven-production-alb-484275327.us-east-1.elb.amazonaws.com/)
1. [Staging](http://testdriven-staging-alb-1378944177.us-east-1.elb.amazonaws.com/)

<br>

<div>
  <p><a class="waves-effect waves-light red darken-1 center-align btn-large" href="https://gum.co/flask">Purchase Now!</a></p>
  <p><a href="{{ site.url }}/part-one-intro">Or, preview parts 1 through 3</a></p>
</div>

<br><hr><br>

#### What will you learn?

##### Part 1

In this first part, you'll learn how to quickly spin up a reproducible development environment with *Docker* to create a *RESTful API* powered by *Python*, *Postgres*, and the *Flask* web framework. After the app is up and running locally, you'll learn how to deploy it to an *Amazon EC2* instance.

**Tools and Technologies**: Python, Flask, Flask-Script, Flask-SQLAlchemy, Flask-Testing, Gunicorn, Nginx, Docker, Docker Compose, Docker Machine, Postgres, Flask Blueprints, Jinja Templates

##### Part 2

In part 2, we'll add *code coverage* and *continuous integration* testing to ensure that each service can be run and tested independently from the whole. Finally, we'll add *ReactJS* along with *Jest*, a JavaScript test runner, and *Enzyme*, a testing library made specifically for React, to the client-side.

**Tools and Technologies**: Code Coverage with Coverage.py, Node, NPM, Create React App, Axios, Flask-CORS, React forms

##### Part 3

In part 3, we'll add *database migrations* along with *password hashing* in order to implement *token-based authentication* to the users service with JSON Web Tokens (JWTs). We'll then turn our attention to the client and add *React Router* to the React app to enable client-side routing along with client-side authentication.

**Tools and Technologies**: Flask-Migrate, Flask-Bcrypt, PyJWT, react-router-dom, React Bootstrap, React Router Bootstrap, React Authentication and Authorization

##### Part 4

In part 4, we'll add an *end-to-end* (e2e) testing solution, *form validation* to the React app, a *Swagger* service to document the API, and deal with some tech debt. We'll also set up a staging environment to test on before the app goes into production.

**Tools and Technologies**: TestCafe, Swagger UI

##### Part 5

In part 5, we'll dive into *container orchestration* with Amazon ECS as we move our staging and production environments to a more scaleable infrastructure. We'll also add Amazon EC2 Container Registry along with Amazon's Elastic Load Balancing for *load balancing* and Amazon's Relational Database Service for *data persistence*.


**Tools and Technologies**: Docker Hub, AWS, EC2, EC2 Container Registry (ECR), EC2 Container Service (ECS), Elastic Load Balancing (ELB), Application Load Balancer (ALB), Relational Database Service (RDS)

##### Part 6

In part 6, we'll focus our attention on adding a new *Flask* service, with two RESTful-resources, to evaluate user-submitted code. Along the way, we'll tie in *AWS Lambda* and *API Gateway* and spend a bit of time refactoring *React* and the *end-to-end* test suite. Finally, we'll update the staging and production environments on ECS.

**Tools and Technologies**: AWS Lambda and API Gateway

##### Part 7

In part 7, we'll refactor the *AWS Lambda* function to make it dynamic so it can be used with more than one exercise, introduce *type checking* on the client-side with *React PropTypes*, and update a number of components. We'll also introduce another new *Flask* service to manage scores. Again, we'll update the staging and production environments on ECS.

**Tools and Technologies**: AWS Lambda and ECS, PropTypes, and Flask

<br>

<div>
  <p><a class="waves-effect waves-light red darken-1 center-align btn-large" href="https://gum.co/flask">Purchase Now!</a></p>
  <p><a href="{{ site.url }}/part-one-intro">Or, preview parts 1 through 3</a></p>
</div>

<br><hr><br>

*Join our mailing list to be notified about updates and new releases.*

<form action="//RealPython.us5.list-manage.com/subscribe/post?u=9fd10a451eec3ca6b2855ab2c&amp;id=801201b3a9" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
<div class="row">
<div class="input-field col s6">
<input placeholder="Enter your email..." id="first_name" type="email" name="EMAIL">
</div>
</div>
<div class="row">
<div class="col s6">
&nbsp;<button class="btn waves-effect waves-light" type="submit" name="action">Submit
<i class="material-icons right">send</i>
</button>
</div>
</div>
</form>

<br>
