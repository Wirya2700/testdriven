---
title: Workflow
layout: post
date: 2017-07-07 23:59:59
permalink: part-four-workflow
intro: false
part: 4
lesson: 9
share: true
---

Updated reference guide...

#### <span style="font-family:'Montserrat', 'sans-serif';">All Services</span>

The following commands are for spinning up all the containers...

##### Environment Variables

Development:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
```

Staging:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_STAGING_IP
$ export SECRET_KEY=SOMETHING_SUPER_SECRET
$ export TEST_URL=http://DOCKER_MACHINE_STAGING_IP
```

Production:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_PROD_IP
$ export SECRET_KEY=SOMETHING_SUPER_SECRET
$ export TEST_URL=http://DOCKER_MACHINE_PROD_IP
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

##### Stop

Stop the containers:

```sh
$ docker-compose stop
```

Bring down the containers:

```sh
$ docker-compose down
```

Remove images:

```sh
$ docker rmi $(docker images -q)
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Individual Services</span>

The following commands are for spinning up individual containers...

##### Users DB

Build and run:

```sh
$ docker-compose up -d --build users-db
```

Test:

```sh
$ docker exec -ti users-db psql -U postgres -W
```

##### Users

Build and run:

```sh
$ docker-compose up -d --build users-service
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

##### Web

Set env variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

Build and run:

```sh
$ docker-compose up -d --build web-service
```

To test, navigate to [http://DOCKER_MACHINE_DEV_IP:9000](http://DOCKER_MACHINE_DEV_IP:9000) in your browser.

> Keep in mind that you won't be able to register or log in until Nginx is set up

To take advantage of auto/hot/live reload, it is recommended to develop out of the container. Navigate to the *flask-microservices-client* directory, set the env variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

Then run `npm start`.

##### Nginx

Build and run:

```sh
$ docker-compose up -d --build nginx
```

To test, navigate to [http://DOCKER_MACHINE_DEV_IP](http://DOCKER_MACHINE_DEV_IP) in your browser. Also, run the e2e tests:

```sh
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
$ testcafe chrome e2e
```

##### Swagger

Build and run:

```sh
$ docker-compose up -d --build swagger
```

To test, navigate to [http://DOCKER_MACHINE_DEV_IP:8080](http://DOCKER_MACHINE_DEV_IP:8080) in your browser.

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

Remove images:

```sh
$ docker rmi $(docker images -q)
```

[Reset](https://stackoverflow.com/a/33251637/1799408) Docker environment back to localhost, unsetting all Docker environment variables:

```sh
$ eval $(docker-machine env -u)
```
