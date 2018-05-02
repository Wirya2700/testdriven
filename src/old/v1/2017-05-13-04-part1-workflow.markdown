---
title: Workflow
layout: post
date: 2017-05-13 23:59:59
permalink: part-one-workflow
intro: false
part: 1
lesson: 10
share: true
---

Reference guide...

#### <span style="font-family:'Montserrat', 'sans-serif';">Aliases</span>

To save some precious keystrokes, let's create aliases for both the `docker-compose` and `docker-machine` commands - `dc` and `dm`, respectively.

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

#### <span style="font-family:'Montserrat', 'sans-serif';">Common Commands</span>

Build the images:

```sh
$ docker-compose build
```

Run the containers:

```sh
$ docker-compose up -d
```

Create the database:

```sh
$ docker-compose run users-service python manage.py recreate_db
```

Seed the database:

```sh
$ docker-compose run users-service python manage.py seed_db
```

Run the tests:

```sh
$ docker-compose run users-service python manage.py test
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Other commands</span>

To stop the containers:

```sh
$ docker-compose stop
```

To bring down the containers:

```sh
$ docker-compose down
```

Want to force a build?

```sh
$ docker-compose build --no-cache
```

Remove images:

```sh
$ docker rmi $(docker images -q)
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Postgres</span>

Want to access the database via psql?

```sh
$ docker exec -ti users-db psql -U postgres -W
```

Then, you can connect to the database and run SQL queries. For example:

```sh
# \c users_dev
# select * from users;
```
