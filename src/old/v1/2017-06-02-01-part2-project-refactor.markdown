---
title: Project Refactor
layout: post
date: 2017-06-02 23:59:58
permalink: part-two-project-refactor
intro: false
part: 2
lesson: 2
share: true
---

In this lesson, we'll break up the base project structure into multiple projects to maintain a clear separation between each service...

---

Before we break up the mono project, it's important to note that you *can* manage a microservice architecture in a single project (with a single git repo). You could add each individual service to a "services" directory as a separate directory, for example. There are pros and cons to each approach - mono repo vs multiple repo. Do your research.

With that, create two new projects:

1. *flask-microservices-main*
1. *flask-microservices-client*

For each, init a new git repo and add a *.gitignore* file.

The *main* project will house the Docker Compose files, Nginx config, and any admin scripts. Essentially, you'll manage all services from this project. Meanwhile, we'll add React to the *client*.

*Steps:*

1. Test current structure
1. Refactor
1. Test new structure
1. Update production

#### <span style="font-family:'Montserrat', 'sans-serif';">Test Current Structure</span>

Run the tests:

```sh
$ docker-compose run users-service python manage.py test
```

All should pass. With tests in place, we can refactor with confidence.

#### <span style="font-family:'Montserrat', 'sans-serif';">Refactor</span>

Bring down the containers and remove the images:

```sh
$ docker-compose down
```

Then remove the containers:

```sh
$ docker-compose rm
```

Do the same for production. Change the active host and point the Docker client at it, and then bring down the containers and remove them along with the images:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
$ docker-compose -f docker-compose-prod.yml down
$ docker-compose -f docker-compose-prod.yml rm
```

Switch the active host back to dev:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```

Move the following files and folders from *flask-microservices-users* to the *flask-microservices-main* project:

```sh
docker-compose-prod.yml
docker-compose.yml
nginx/Dockerfile
nginx/flask.conf
```

Back in the *flask-microservices-users* project, commit your code and push up the changes.

Then update the `build` commands for `users-db` and `users-service` to point to the [git repo](https://docs.docker.com/engine/reference/commandline/build/#git-repositories) within both Docker Compose files:

1. `users-db`

    ```
    build: https://github.com/realpython/flask-microservices-users.git#master:project/db
    ```

    > `master:project/db` uses the *Dockerfile* found in "project/db" in the `master` branch.

1. `users-service`:

    ```
    build: https://github.com/realpython/flask-microservices-users.git
    ```

Since this changes the "build context" from the local machine to a git repo, we need to remove the volume from `users-service`. Once removed, build the images and spin up the containers:

```sh
$ docker-compose up -d --build
```

> While this is spinning up think about why we had to remove the volume. What is the "build context"? Turn to Google for help.

#### <span style="font-family:'Montserrat', 'sans-serif';">Test New Structure</span>

Once up, create and seed the db and run the tests:

```sh
$ docker-compose run users-service python manage.py recreate_db
$ docker-compose run users-service python manage.py seed_db
$ docker-compose run users-service python manage.py test
```

Grab the IP, from `docker-machine ip dev`, and make sure the app works in the browser.

#### <span style="font-family:'Montserrat', 'sans-serif';">Update Production</span>

First, change the active host and point the Docker client at it:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
```

Bring up the containers:

```sh
$ docker-compose -f docker-compose-prod.yml up -d --build
```

Just like before, create and seed the db and run the tests:

```sh
$ docker-compose -f docker-compose-prod.yml run users-service python manage.py recreate_db
$ docker-compose -f docker-compose-prod.yml run users-service python manage.py seed_db
$ docker-compose -f docker-compose-prod.yml run users-service python manage.py test
```

Test in the browser as well. Commit your code and push up to GitHub.
