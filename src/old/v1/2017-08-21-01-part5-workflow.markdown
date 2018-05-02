---
title: Workflow
layout: post
date: 2017-08-21 23:59:59
permalink: part-five-workflow
intro: false
part: 5
lesson: 9
share: true
---

Updated reference guide...

#### <span style="font-family:'Montserrat', 'sans-serif';">Development Environment</span>

The following commands are for spinning up all the containers in your `development` environment...

##### Environment 

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
```

##### Start  

Build the images:

```sh
$ docker-compose build
```

Run the containers:

```sh
$ docker-compose up -d
```

Create and seed the database:

```sh
$ docker-compose run users-service python manage.py recreate_db
$ docker-compose run users-service python manage.py seed_db
```

Run the unit and integration tests:

```sh
$ docker-compose run users-service python manage.py test
```

Run the e2e tests:

```sh
$ testcafe chrome e2e
```

Enter psql:

```sh
$ docker exec -ti users-db psql -U postgres -W
```

##### Stop

Stop the containers:

```sh
$ docker-compose stop
```

Bring down the containers:

```sh
$ docker-compose down
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Aliases</span>

To save some precious keystrokes, create aliases for both the `docker-compose` and `docker-machine` commands - `dc` and `dm`, respectively.

Simply add the following lines to your *.bashrc* file:

```
alias dc='docker-compose'
alias dm='docker-machine'
```

Save the file, then execute it:

```sh
$ source ~/.bashrc
```

Test out the new aliases!

> On Windows? You will first need to create a [PowerShell Profile](https://msdn.microsoft.com/en-us/powershell/scripting/core-powershell/ise/how-to-use-profiles-in-windows-powershell-ise) (if you don't already have one), and then you can add the aliases to it using [Set-Alias](https://msdn.microsoft.com/en-us/powershell/reference/5.1/microsoft.powershell.utility/set-alias) - i.e., `Set-Alias dc docker-compose`.

#### <span style="font-family:'Montserrat', 'sans-serif';">"Saved" State</span>

Is the VM stuck in a "Saved" state?

```sh
$ docker-machine ls

NAME   ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER        ERRORS
aws    *        amazonec2    Running   tcp://34.207.173.181:2376           v17.05.0-ce
dev    -        virtualbox   Saved                                         Unknown
```

To break out of this, you'll need to power off the VM:

1. Start virtualbox - `virtualbox`
1. Select the VM and click "start"
1. Exit the VM and select "Power off the machine"
1. Exit virtualbox

The VM should now have a "Stopped" state:

```sh
$ docker-machine ls

NAME   ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER        ERRORS
aws    *        amazonec2    Running   tcp://34.207.173.181:2376           v17.05.0-ce
dev    -        virtualbox   Stopped                                       Unknown
```

Now you can start the machine:

```sh
$ docker-machine start dev
```

It should be "Running":

```sh
$ docker-machine ls

NAME   ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER        ERRORS
aws    *        amazonec2    Running   tcp://34.207.173.181:2376           v17.05.0-ce
dev    -        virtualbox   Running   tcp://192.168.99.100:2376           v17.05.0-ce
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Other Commands</span>

Want to force a build?

```sh
$ docker-compose build --no-cache
```

Remove exited containers:

```sh
$ docker rm -v $(docker ps -a -q -f status=exited)
```

Remove images:

```sh
$ docker rmi $(docker images -q)
```

Remove untagged images:

```sh
$ docker rmi $(docker images | grep “^<none>” | awk ‘{print $3}’)
```

[Reset](https://stackoverflow.com/a/33251637/1799408) Docker environment back to localhost, unsetting all Docker environment variables:

```sh
$ eval $(docker-machine env -u)
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Development Workflow</span>

Try out the following development workflow...

**Development**:

1. Create a new feature branch from the `master` branch
1. Make code changes locally
1. Open PR against the `development` branch
1. New build is triggered on Travis CI
1. If the tests pass, merge the PR
1. New build is triggered on Travis CI
1. If the tests pass, images are created, tagged `development`, and pushed to Docker Hub

**Staging**:

1. Open PR from the `development` branch against the `staging` branch
1. New build is triggered on Travis CI
1. If the tests pass, merge the PR
1. New build is triggered on Travis CI
1. If the tests pass, images are created, tagged `staging`, and pushed to ECR

**Production**:

1. Open PR from the `development` branch against the `staging` branch
1. New build is triggered on Travis CI
1. If the tests pass, merge the PR
1. New build is triggered on Travis CI
1. If the tests pass, images are created, tagged `production`, and pushed to ECR
1. Merge the changes into the `master` branch
