---
title: ECS Deployment
layout: post
date: 2017-10-04 23:59:59
permalink: part-six-ecs-deployment
intro: false
part: 6
lesson: 10
share: true
---

Finally, let's update staging and production...

---

Set `dev` as the active machine:

```sh
$ docker-machine env dev
$ eval $(docker-machine env dev)
```

Set the environment variables:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP:5001
$ export REACT_APP_EVAL_SERVICE_URL=DOCKER_MACHINE_DEV_IP:5002
$ export TEST_URL=http://DOCKER_MACHINE_DEV_IP
```

Fire up the containers:

```sh
$ docker-compose up -d --build
```

Create the databases:

```sh
$ docker-compose run eval-service python manage.py recreate_db
$ docker-compose run users-service python manage.py recreate_db
```

Apply the seeds:

```sh
$ docker-compose run eval-service python manage.py seed_db
$ docker-compose run users-service python manage.py seed_db
```

Run the full test suite to ensure all tests pass locally:

```sh
sh test.sh
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Travis</span>

Next, we need to configure Travis to handle the new `eval` and `eval-db` services.

Make sure the `master` branch is updated for each of the following repos, locally as well as on GitHub:

1. `flask-microservices-users`
1. `flask-microservices-eval`
1. `flask-microservices-client`
1. `flask-microservices-swagger`
1. `flask-microservices-main`

The Travis builds should also pass for the first two services.

Update *.travis.yml* in *flask-microservices-main*, adding in the proper environment variables and updating the `script` to run the tests and create the DB for the `eval-service`:

```yaml
language: node_js
node_js: '7'

before_install:
  - stty cols 80

dist: trusty
sudo: required

addons:
  apt:
    sources:
     - google-chrome
    packages:
     - google-chrome-stable

services:
  - docker

env:
  global:
    - DOCKER_COMPOSE_VERSION=1.11.2
    - COMMIT=${TRAVIS_COMMIT::8}
    - USERS=flask-microservices-users
    - USERS_REPO=https://github.com/realpython/$USERS.git
    - USERS_DB=flask-microservices-users_db
    - USERS_DB_REPO=https://github.com/realpython/$USERS.git#master:project/db
    - CLIENT=flask-microservices-client
    - CLIENT_REPO=https://github.com/realpython/$CLIENT.git
    - SWAGGER=flask-microservices-swagger
    - SWAGGER_REPO=https://github.com/realpython/$SWAGGER.git
    - EVAL=flask-microservices-eval
    - EVAL_REPO=https://github.com/realpython/$EVAL.git
    - EVAL_DB=flask-microservices-eval_db
    - EVAL_DB_REPO=https://github.com/realpython/$EVAL.git#master:project/db
    - NGINX=flask-microservices-nginx
    - NGINX_REPO=https://github.com/realpython/flask-microservices-main.git#master:nginx

before_install:
  - sudo rm /usr/local/bin/docker-compose
  - curl -L https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > docker-compose
  - chmod +x docker-compose
  - sudo mv docker-compose /usr/local/bin

before_script:
  - export TEST_URL=http://127.0.0.1
  - export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1
  - export REACT_APP_EVAL_SERVICE_URL=http://127.0.0.1
  - export SECRET_KEY=my_precious
  - export DISPLAY=:99.0
  - sh -e /etc/init.d/xvfb start
  - sleep 3
  - bash ./docker_build.sh

script:
  - docker-compose -f docker-compose-ci.yml run users-service python manage.py test
  - docker-compose -f docker-compose-ci.yml run users-service python manage.py recreate_db
  - docker-compose -f docker-compose-ci.yml run eval-service python manage.py test
  - docker-compose -f docker-compose-ci.yml run eval-service python manage.py recreate_db
  - docker-compose -f docker-compose-ci.yml run eval-service python manage.py seed_db
  - testcafe chrome e2e

after_script:
  - docker-compose down

after_success:
  - bash ./docker_push.sh
  - bash ./docker_deploy.sh
  - bash ./docker_deploy_prod.sh
```

Then, add the new services along with the proper `args` to the `web-service` in the *docker-compose-ci.yml* file:

```yaml
version: '2.1'

services:

  users-db:
    container_name: users-db
    build:
      context: https://github.com/realpython/flask-microservices-users.git#master:project/db
    ports:
      - 5435:5432  # expose ports - HOST:CONTAINER
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: exit 0

  users-service:
    container_name: users-service
    build:
      context: https://github.com/realpython/flask-microservices-users.git
    expose:
      - '5000'
    environment:
      - APP_SETTINGS=project.config.StagingConfig
      - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_staging
      - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      users-db:
        condition: service_healthy
    links:
      - users-db
    command: gunicorn -b 0.0.0.0:5000 manage:app

  nginx:
    container_name: nginx
    build: ./nginx/
    restart: always
    ports:
      - 80:80
    depends_on:
      users-service:
        condition: service_started
      web-service:
        condition: service_started
    links:
      - users-service
      - web-service

  web-service:
    container_name: web-service
    build:
      context: https://github.com/realpython/flask-microservices-client.git
      args:
        - NODE_ENV=development
        - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
        - REACT_APP_EVAL_SERVICE_URL=${REACT_APP_EVAL_SERVICE_URL}
    ports:
      - '9000:9000' # expose ports - HOST:CONTAINER
    depends_on:
      users-service:
        condition: service_started
    links:
      - users-service

  swagger:
    container_name: swagger
    build:
      context: https://github.com/realpython/flask-microservices-swagger.git
    ports:
      - '8080:8080' # expose ports - HOST:CONTAINER
    environment:
      - API_URL=https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger.json
    depends_on:
      users-service:
        condition: service_started

  eval-service:
    container_name: eval-service
    build:
      context: https://github.com/realpython/flask-microservices-eval.git
    expose:
      - 5002:5000 # expose ports - HOST:CONTAINER
    environment:
      - APP_SETTINGS=project.config.StagingConfig
      - USERS_SERVICE_URL=http://users-service:5000
      - DATABASE_URL=postgres://postgres:postgres@eval-db:5432/eval_staging
      - DATABASE_TEST_URL=postgres://postgres:postgres@eval-db:5432/eval_test
    depends_on:
      users-service:
        condition: service_started
      eval-db:
        condition: service_healthy
    links:
      - users-service
      - eval-db
    command: gunicorn -b 0.0.0.0:5000 manage:app

  eval-db:
    container_name: eval-db
    build:
      context: https://github.com/realpython/flask-microservices-eval.git#master:project/db
    ports:
        - 5436:5432  # expose ports - HOST:CONTAINER
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: exit 0
```

Add two new `location` blocks to *nginx/nginx.conf*:

```
location /scores {
    proxy_pass http://eval-service:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /exercises {
    proxy_pass http://eval-service:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Make sure to set all of the environment variables in *flask-microservices-client/Dockerfile*:

```sh
# add environment variables
ARG REACT_APP_USERS_SERVICE_URL
ENV REACT_APP_USERS_SERVICE_URL=$REACT_APP_USERS_SERVICE_URL
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
ARG REACT_APP_EVAL_SERVICE_URL
ENV REACT_APP_EVAL_SERVICE_URL=$REACT_APP_EVAL_SERVICE_URL
```

Commit and push your code in *flask-microservices-client*, and then do the same in *flask-microservices-main* to trigger a new Travis build. Make sure it passes!

#### <span style="font-family:'Montserrat', 'sans-serif';">Development</span>

Check out the `development` branch locally, and then rebase `master` on `development`:

```sh
$ git checkout development
$ git rebase master
```

Now, let's update some of the build scripts...

##### *docker_push.sh*

Update the last `if` block:

```sh
if [ "$TRAVIS_BRANCH" == "development" ] || \
   [ "$TRAVIS_BRANCH" == "staging" ] || \
   [ "$TRAVIS_BRANCH" == "production" ]
then
  # users
  if [ "$TRAVIS_BRANCH" == "production" ]
  then
    docker build $USERS_REPO -t $USERS:$COMMIT -f Dockerfile-prod
  else
    docker build $USERS_REPO -t $USERS:$COMMIT
  fi
  docker tag $USERS:$COMMIT $REPO/$USERS:$TAG
  docker push $REPO/$USERS:$TAG
  # users db
  docker build $USERS_DB_REPO -t $USERS_DB:$COMMIT
  docker tag $USERS_DB:$COMMIT $REPO/$USERS_DB:$TAG
  docker push $REPO/$USERS_DB:$TAG
  # eval
  if [ "$TRAVIS_BRANCH" == "production" ]
  then
    docker build $EVAL_REPO -t $EVAL:$COMMIT -f Dockerfile-prod
  else
    docker build $EVAL_REPO -t $EVAL:$COMMIT
  fi
  docker tag $EVAL:$COMMIT $REPO/$EVAL:$TAG
  docker push $REPO/$EVAL:$TAG
  # eval db
  docker build $EVAL_DB_REPO -t $EVAL_DB:$COMMIT
  docker tag $EVAL_DB:$COMMIT $REPO/$EVAL_DB:$TAG
  docker push $REPO/$EVAL_DB:$TAG
  # client
  docker build $CLIENT_REPO -t $CLIENT:$COMMIT
  docker tag $CLIENT:$COMMIT $REPO/$CLIENT:$TAG
  docker push $REPO/$CLIENT:$TAG
  # swagger
  docker build $SWAGGER_REPO -t $SWAGGER:$COMMIT
  docker tag $SWAGGER:$COMMIT $REPO/$SWAGGER:$TAG
  docker push $REPO/$SWAGGER:$TAG
  # nginx
  docker build $NGINX_REPO -t $NGINX:$COMMIT
  docker tag $NGINX:$COMMIT $REPO/$NGINX:$TAG
  docker push $REPO/$NGINX:$TAG
fi
```

Commit your code and push to GitHub, which will trigger a new build on Travis. Make sure the build passes and that the pushes to Docker Hub were successful.

#### <span style="font-family:'Montserrat', 'sans-serif';">Staging</span>

Check out the `staging` branch locally, and then rebase `development` on `staging`:

```sh
$ git checkout staging
$ git rebase development
```

##### *docker_push.sh*

Update the environment variables in the `if [ "$TRAVIS_BRANCH" == "staging" ]` block, making sure to update `REACT_APP_USERS_SERVICE_URL`:

```sh
if [ "$TRAVIS_BRANCH" == "staging" ]
then
  export REACT_APP_USERS_SERVICE_URL="LOAD_BALANCER_DNS_NAME"
  export REACT_APP_EVAL_SERVICE_URL="LOAD_BALANCER_DNS_NAME"
  export SECRET_KEY="my_precious"
fi
```

##### *docker_deploy.sh*

Add `eval` to the `deploy_cluster` function:

```sh
# eval
family="flask-microservices-eval-td"
service="flask-microservices-eval"
template="ecs_eval_taskdefinition.json"
task_template=$(cat "ecs/$template")
task_def=$(printf "$task_template" $AWS_ACCOUNT_ID $AWS_ACCOUNT_ID)
echo "$task_def"
register_definition
update_service
```

##### *ecs_eval_taskdefinition.json*

Create a new Task Definition file:

```json
{
  "containerDefinitions": [
    {
      "name": "eval-service",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-eval:staging",
      "essential": true,
      "memoryReservation": 300,
      "cpu": 300,
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 0,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "APP_SETTINGS",
          "value": "project.config.StagingConfig"
        },
        {
          "name": "DATABASE_TEST_URL",
          "value": "postgres://postgres:postgres@eval-db:5432/eval_test"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgres://postgres:postgres@eval-db:5432/eval_staging"
        },
        {
          "name": "USERS_SERVICE_URL",
          "value": "http://LOAD_BALANCER_DNS_NAME"
        }
      ],
      "links": [
        "eval-db"
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "flask-microservices-staging",
          "awslogs-region": "us-east-1"
        }
      }
    },
    {
      "name": "eval-db",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-eval_db:staging",
      "essential": true,
      "memoryReservation": 300,
      "cpu": 300,
      "portMappings": [
        {
          "containerPort": 5432
        }
      ],
      "environment": [
        {
          "name": "POSTGRES_PASSWORD",
          "value": "postgres"
        },
        {
          "name": "POSTGRES_USER",
          "value": "postgres"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "flask-microservices-staging",
          "awslogs-region": "us-east-1"
        }
      }
    }
  ]
}
```

> Again, update the `USERS_SERVICE_URL` environment variable.

Add the Image repos to [ECR](https://aws.amazon.com/ecr/):

1. `flask-microservices-eval`
1. `flask-microservices-eval_db`

##### Target Group

Next, let's add a new Target Group for the `eval` service. Within [Amazon EC2](https://console.aws.amazon.com/ec2), click "Target Groups", and then create the following Group:

1. "Target group name": `eval-tg`
1. "Port": `5000`

Then, under "Health check settings":

1. "Path": `/scores`

##### Load Balancer

Then, on the "Load Balancers" page, click the `flask-microservices-staging-alb` Load Balancer, and then select the "Listeners" tab. Here, we can add Listeners to the ALB, which are then forwarded to a specific Target Group.

There should already be a listener for "HTTP : 80". Click the "View/edit rules" link, and then insert four new rules:

1. If `/exercises`, Then `eval-tg`
1. If `/exercises/*`, Then `eval-tg`
1. If `/scores`, Then `eval-tg`
1. If `/scores/*`, Then `eval-tg`

##### Services

Create the following ECS Service:

1. "Task Definition": `flask-microservices-eval-td:LATEST_REVISION_NUMBER`
1. "Service name": flask-microservices-staging-eval
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-staging-alb`
1. "Select a Container": `eval-service:0:5000`

Click "Add to ELB".

1. "Listener port": `80:HTTP`
1. "Target group name": eval-tg

Click "Save" and then "Create Service".

##### Migrations

We also need to run the migrations. Update the *entrypoint.sh* script in *flask-microservices-eval*:

```sh
#!/bin/sh

echo "Waiting for postgres..."

while ! nc -z eval-db 5432; do
  sleep 0.1
done

echo "PostgreSQL started"

python manage.py recreate_db
python manage.py seed_db
gunicorn -b 0.0.0.0:5000 manage:app
```

Commit and push your code up to GitHub.

##### Sanity Check

Commit. Push to GitHub. Make sure the Travis build passes and then jump to AWS and verify that the-

1. Images are up-to-date on ECR
1. `flask-microservices-eval-td` Task Definition was created
1. `eval-tg` Target Group has healthy, registered instances

Grab the "DNS name" for the Load Balancer, and then test each URL in the browser:

| Endpoint        | HTTP Method | Authenticated?  | Result            |
|-----------------|-------------|-----------------|-------------------|
| /auth/register  | POST        | No              | register user     |
| /auth/login     | POST        | No              | log in user       |
| /auth/logout    | GET         | Yes             | log out user      |
| /auth/status    | GET         | Yes             | check user status |
| /users          | GET         | No              | get all users     |
| /users/:id      | GET         | No              | get single user   |
| /users          | POST        | Yes (admin)     | add a user        |
| /ping           | GET         | No              | sanity check      |
| /scores              | GET    | No             | get all scores              |
| /scores/:id          | GET    | No             | get single score            |
| /scores/user         | GET    | Yes            | get all scores by user id   |
| /scores/user/:id     | GET    | Yes            | get single score by user id |
| /scores              | POST   | Yes            | add a score                 |
| /scores/:id          | PUT    | Yes            | update a score              |
| /scores          | PATCH  | Yes            | upsert (update or add if the score does not exist)             |
| /exercises | GET         | No             | get all exercises |
| /exercises | POST        | Yes (admin)    | add an exercise   |

> Remember: If you run into errors, you can always check the logs on [CloudWatch](https://console.aws.amazon.com/cloudwatch), in the `flask-microservices-staging` group, or SSH directly into the EC2 instance to debug the containers:
>
```sh
$ ssh -i ~/.ssh/ecs.pem ec2-user@EC2_PUBLIC_IP
```
Be sure to double-check all environment variables!

#### <span style="font-family:'Montserrat', 'sans-serif';">Production</span>

You know the drill: Check out the `production` branch locally, and then rebase `staging` on `production`:

```sh
$ git checkout production
$ git rebase staging
```

##### *docker_deploy_prod.sh*


Add `eval` to the `deploy_cluster` function:

```sh
# eval
family="flask-microservices-eval-prod-td"
service="flask-microservices-prod-eval"
template="ecs_eval_prod_taskdefinition.json"
task_template=$(cat "ecs/$template")
task_def=$(printf "$task_template" $AWS_ACCOUNT_ID $AWS_RDS_URI $PRODUCTION_SECRET_KEY)
echo "$task_def"
register_definition
update_service
```

##### *ecs_eval_taskdefinition.json*

Create a new Task Definition file:

```json
{
  "containerDefinitions": [
    {
      "name": "eval-service-prod",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-eval:production",
      "essential": true,
      "memoryReservation": 300,
      "cpu": 300,
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 0,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "APP_SETTINGS",
          "value": "project.config.ProductionConfig"
        },
        {
          "name": "DATABASE_URL",
          "value": "%s"
        },
        {
          "name": "USERS_SERVICE_URL",
          "value": "%s"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "flask-microservices-production",
          "awslogs-region": "us-east-1"
        }
      }
    }
  ]
}
```

##### Target Group

Add a new Target Group for the `eval` service:

1. "Target group name": `eval-prod-tg`
1. "Port": `5000`

Under "Health check settings":

1. "Path": `/scores`

##### Load Balancer

On the "Load Balancers" page, click the `flask-microservices-prod-alb` Load Balancer, and then select the "Listeners" tab. Click the "View/edit rules" link, and then insert four new rules:

1. If `/exercises`, Then `eval-prod-tg`
1. If `/exercises/*`, Then `eval-prod-tg`
1. If `/scores`, Then `eval-prod-tg`
1. If `/scores/*`, Then `eval-prod-tg`

##### Services

Next, create a new ECS Service:

1. "Task Definition": `flask-microservices-eval-prod-td:LATEST_REVISION_NUMBER`
1. "Service name": `flask-microservices-prod-eval`
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-prod-alb`
1. "Select a Container": `eval-service:0:5000`

Click "Add to ELB".

1. "Listener port": `80:HTTP`
1. "Target group name": `eval-prod-tg`

Click "Save" and then "Create Service".

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check (Take One)</span>

Commit and push to GitHub. Once the build passes, hop on to AWS to confirm that the images are up-to-date on ECR and that an `flask-microservices-eval-prod-td` Task Definition was created. The EC2 instance associated with the Target Group, `eval-prod-tg`, should not be healthy since we still need to set up the database.

Feel free to test out the other endpoints to make sure all is well.

Before we add the database, let's ensure the app is up and working right with the ALB. Add a new, unprotected route to *flask-microservices-eval/project/api/eval.py*:

```python
@eval_blueprint.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'success',
        'message': 'sanity check!'
    })
```

Add a test. Then, update the path for the Health check for the `eval-prod-tg` to `/health`. Add the rule to the Load Balancer as well. The next time the `flask-microservices-prod-eval` service is spun up, the Target Group should have a healthy instance associated with it.

Test it out in the browser at  [http://LOAD_BALANCER_DNS_NAME/health](http://LOAD_BALANCER_DNS_NAME/health).

##### RDS

Within [Amazon RDS](https://console.aws.amazon.com/rds), select "Instances" on the sidebar, and then click the "Launch DB Instance" button.

> You *probably* want to click the "Free tier eligible only". More [info](https://aws.amazon.com/free/).


Select the "PostgreSQL" engine and then "Dev/Test":

1. "DB Engine Version": `PostgreSQL 9.6.2-R1`
1. "DB Instance Class": `db.t2.micro`
1. "Multi-AZ Deployment": `No`
1. "Storage Type": `General Purpose (SSD)`
1. "Allocated Storage": `5 GB`
1. "DB Instance Identifier": `flask-microservices-eval-prod`
1. "Master Username": `webapp`
1. "Master Password": `something_super_secret`

Click "Next Step". Under "Network & Security", make sure to pick the "VPC" and "Security group" associated with ALB. Select one of the available "Subnets" as well - either `us-east-1a` or `us-east-1b`.

Take note of the production URI:

```
postgres://webapp:YOUR_PASSWORD@YOUR_ADDRESS:5432/eval_prod
```

Update `eval` in the `deploy_cluster` function again in *docker_deploy_prod.sh*, adding the `AWS_RDS_EVAL_URI` and `$PRODUCTION_URI` environment variables:

```sh
# eval
family="flask-microservices-eval-prod-td"
service="flask-microservices-prod-eval"
template="ecs_eval_prod_taskdefinition.json"
task_template=$(cat "ecs/$template")
task_def=$(printf "$task_template" $AWS_ACCOUNT_ID $AWS_RDS_EVAL_URI $PRODUCTION_URI)
echo "$task_def"
register_definition
update_service
```

Add the AWS_RDS_EVAL_URI and PRODUCTION_URI environment variables to the  *flask-microservices-main* Travis project as well.

Commit. Push your code to GitHub. Once done, the app should be live, ready to go.

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check (Take Two)</span>

Grab the Container ID for `flask-microservices-eval` (via `docker ps`), enter the shell within the running container, and then update the database:

```sh
$ docker exec -it Container_ID bash
# python manage.py recreate_db
# python manage.py seed_db
```

Ensure all URLs work properly, and then run the e2e tests. Within, *flask-microservices-main*, set the `TEST_URL` environment variable and then run the tests:

```sh
$ export TEST_URL=LOAD_BALANCER_DNS_NAME
$ testcafe chrome e2e
```
