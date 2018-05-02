---
title: ECS Production
layout: post
date: 2017-08-14 23:59:59
permalink: part-five-ec2-container-service-production
intro: false
part: 5
lesson: 8
share: true
---

In this lesson, we'll set up our production Cluster on ECS...

---

Start by reviewing the Staging Cluster. Which AWS resources do we need to set up for the Production Cluster? Think about the steps we have to take...

1. Create an Application Load Balancer (ALB)
1. Configure Target Groups
1. Add Listeners to the ALB
1. Create An ECS Cluster
1. Create new *Dockerfile* for *flask-microservices-users*
1. Update the *docker_push.sh* file
1. Add images to ECR
1. Create new Swagger Spec
1. Create Task Definitions
1. Add new local Task Definition JSON files
1. Create Services
1. Sanity Check (Take One)
1. Create a Docker deploy file
1. Update Travis file
1. Sanity Check (take two)

Let's get to it!

> This is a great time to check your understanding. There are a number of steps, but the only difference between production and staging is the RDS database. Do your best to configure everything on your own before reviewing the lesson.

#### <span style="font-family:'Montserrat', 'sans-serif';">Create an ALB</span>

Navigate to [Amazon EC2](https://console.aws.amazon.com/ec2/), click "Load Balancers" on the sidebar, and then click the "Create Load Balancer" button. Select "Application Load Balancer".

"Step 1: Configure Load Balancer":

1. "Name": `flask-microservices-prod-alb`
1. "Availability Zones": `us-east-1a`, `us-east-1b`

"Step 2: Configure Security Settings":

1. Skip this step for now

"Step 3: Configure Security Groups":

1. Select an existing security group or create a new security group, making sure at least HTTP 80 and SSH 22 are open.

"Step 4: Configure Routing":

1. "Name": `client-prod-tg`
1. "Port": `9000`
1. "Path": `/`

"Step 5: Register Targets":

1. Don't assign any instances manually since this will be managed by ECS.

#### <span style="font-family:'Montserrat', 'sans-serif';">Target Groups</span>

Next, set up new Target Groups for `swagger` and `users-service`. Within [Amazon EC2](https://console.aws.amazon.com/ec2/), click "Target Groups", and then create the following Target Groups:

##### Target Group 1: *flask-microservices-users*

1. "Target group name": `users-prod-tg`
1. "Port": `5000`

Then, under "Health check settings":

1. "Path": `/ping`

##### Target Group 2: *flask-microservices-swagger*

1. "Target group name": `swagger-prod-tg`
1. "Port": `8080`

Then, under "Health check settings":

1. "Path": `/`

#### <span style="font-family:'Montserrat', 'sans-serif';">Add Listeners to the ALB</span>

Back on the "Load Balancers" page, click the `flask-microservices-prod-alb` Load Balancer, and then select the "Listeners" tab. Here, we can add [Listeners](http://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html) to the ALB, which are then forwarded to a specific Target Group.

There should already be a listener for "HTTP : 80". Click the "View/edit rules >" link, and then insert four new rules:

1. If `/auth/*`, Then `users-tg`
1. If `/users`, Then `users-tg`
1. If `/users/*`, Then `users-tg`
1. If `/ping`, Then `users-tg`

Add a new listener:

1. "Protocol": `HTTP`
1. "Port": `8080`
1. "Default target group": `swagger-tg`

#### <span style="font-family:'Montserrat', 'sans-serif';">Create An ECS Cluster</span>

Navigate to [Amazon ECS](https://console.aws.amazon.com/ecs), and create a new Cluster:

1. "Cluster name": `flask-microservices-prod-cluster`
1. "EC2 instance type": `t2.micro`
1. "Number of instances": `6`
1. "Key pair": `ecs`

> Although it doesn't matter so much for this course, it is best practice to use a different key pair for production, especially for large development teams. 

Make sure to pick the "VPC" and "Security group" associated with ALB. Select one of the available "Subnets" as well - either `us-east-1a` or `us-east-1b`.

#### <span style="font-family:'Montserrat', 'sans-serif';">Create New *Dockerfile* For *flask-microservices-users*</span>

Next, within *flask-microservices-users*, create a new file called *Dockerfile-prod*:

```
FROM python:3.6.1

# install environment dependencies
RUN apt-get update -yqq \
  && apt-get install -yqq --no-install-recommends \
    netcat \
  && apt-get -q clean

# set working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# add requirements (to leverage Docker cache)
ADD ./requirements.txt /usr/src/app/requirements.txt

# install requirements
RUN pip install -r requirements.txt

# add app
ADD . /usr/src/app

# run server
CMD gunicorn -b 0.0.0.0:5000 manage:app
```

So, instead of running *entrypoint.sh*, we are now just running Gunicorn. Why? Well, first off, we will not be using a `users-db` container in production. Also, we only want to create the database and seed it once, rather than on every deploy, to persist the data.

Commit and push your changes to GitHub.

#### <span style="font-family:'Montserrat', 'sans-serif';">Update The *docker_push.sh* File</span>

Within *flask-microservices-main*, update the environment variables for `production` in *docker_push.sh*:

```sh
if [ "$TRAVIS_BRANCH" == "production" ]
then
  export REACT_APP_USERS_SERVICE_URL="LOAD_BALANCER_DNS_NAME"
  export DATABASE_URL="$AWS_RDS_URI"
  export SECRET_KEY="$PRODUCTION_SECRET_KEY"
fi
```

Add the `AWS_RDS_URI` and `PRODUCTION_SECRET_KEY` environment variables to the *flask-microservices-main* Travis project.

To create a key, open the Python shell and run:

```python
>>> import binascii
>>> import os
>>> binascii.hexlify(os.urandom(24))
b'958185f1b6ec1290d5aec4eb4dc77e67846ce85cdb7a212a'
```

Also, update the building, tagging, and pushing of images section in *docker_push.sh*:

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

#### <span style="font-family:'Montserrat', 'sans-serif';">Add Images To ECR</span>

Assuming you are still using the `ecs` feature branch, create a new branch on GitHub called `production`. Within *flask-microservices-main*, commit and push your code to GitHub. Open a PR against the `production` branch, and then merge the PR once the Travis build passes, to trigger a new build.

Once done, you should see that a new image image was added to each of the repositories on ECR with a tag of `production`.

> Since we're not using *flask-microservices-users_db* or *flask-microservices-nginx* in production, you may want to update the *docker_push.sh* file so they are not built, tagged, or pushed when the branch is `production`.

#### <span style="font-family:'Montserrat', 'sans-serif';">Create New Swagger Spec</span>

Next, let's add a production Swagger Spec file. Within *flask-microservices-swagger*, create a duplicate of the current Spec file, *swagger.json*, called *swagger-prod.json*. Update the `host` to the LOAD_BALANCER_DNS_NAME.

Commit and push the changes up to GitHub.

#### <span style="font-family:'Montserrat', 'sans-serif';">Create Task Definitions</span>

Create the following Task Definitions...

##### *flask-microservices-client*

1. "Task Definition Name": `flask-microservices-client-prod-td`
1. Container:
  1. "Container name": `client-prod`
  1. "Image": `YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/flask-microservices-client:production`
  1. "Memory Limits (MB)": `300` soft limit
  1. "Port mappings": `0` host, `9000` container
  1. "Env Variables":
      - `NODE_ENV` - `production`
      - `REACT_APP_USERS_SERVICE_URL` - http://LOAD_BALANCER_DNS_NAME

##### *flask-microservices-swagger*

1. "Task Definition Name": `flask-microservices-swagger-prod-td`
1. Container:
  1. "Container name": `swagger-prod`
  1. "Image": `YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/flask-microservices-swagger:production`
  1. "Memory Limits (MB)": `300` soft limit
  1. "Port mappings": `0` host, `8080` container
  1. "Env Variables":
      - `API_URL` - `https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger-prod.json`

##### *flask-microservices-users*

1. "Task Definition Name": `flask-microservices-users-prod-td`
1. Container:
  1. "Container name": `users-service-prod`
  1. "Image": `YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/flask-microservices-users:production`
  1. "Memory Limits (MB)": `300` soft limit
  1. "Port mappings": `0` host, `5000` container
  1. "Env Variables":
      - `APP_SETTINGS` - `project.config.ProductionConfig`
      - `DATABASE_URL` - YOUR_RDS_URI
      - `SECRET_KEY` - TBD

#### <span style="font-family:'Montserrat', 'sans-serif';">Add New Local Task Definition JSON Files</span>

Next, within the "ecs" folder, add the Task Definition JSON files to match the Task Definitions we just added...

*ecs_client_prod_taskdefinition.json*:

```json
{
  "containerDefinitions": [
    {
      "name": "client-prod",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-client:production",
      "essential": true,
      "memoryReservation": 300,
      "cpu": 300,
      "portMappings": [
        {
          "containerPort": 9000,
          "hostPort": 0,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "REACT_APP_USERS_SERVICE_URL",
          "value": "http://LOAD_BALANCER_DNS_NAME"
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

*ecs_swagger_prod_taskdefinition.json*:

```json
{
  "containerDefinitions": [
    {
      "name": "swagger-prod",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-swagger:production",
      "essential": true,
      "memoryReservation": 300,
      "cpu": 300,
      "portMappings": [
        {
          "containerPort": 8080,
          "hostPort": 0,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "API_URL",
          "value": "https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger-prod.json"
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

*ecs_users_prod_taskdefinition.json*:

```json
{
  "containerDefinitions": [
    {
      "name": "users-service-prod",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-users:production",
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
          "name": "SECRET_KEY",
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

Make sure you update `http://LOAD_BALANCER_DNS_NAME` in *ecs_client_prod_taskdefinition.json* and set up the production logs. To set up, navigate to [CloudWatch](https://console.aws.amazon.com/cloudwatch), click "Logs", click the "Actions" drop-down button, and then select "Create log group". Name the group `flask-microservices-production`.

#### <span style="font-family:'Montserrat', 'sans-serif';">Create Services</span>

Add the following Services...

##### *flask-microservices-client*

1. "Task Definition": `flask-microservices-client-prod-td:LATEST_REVISION_NUMBER`
1. "Service name": `flask-microservices-prod-client`
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-prod-alb`
1. "Select a Container": `client-prod:0:9000`

Click "Add to ELB".

1. "Listener port": `80:HTTP`
1. "Target group name": `client-prod-tg`

Click "Save" and then "Create Service".

##### *flask-microservices-swagger*

1. "Task Definition": `flask-microservices-swagger-prod-td:LATEST_REVISION_NUMBER`
1. "Service name": `flask-microservices-prod-swagger`
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-prod-alb`
1. "Select a Container": `swagger-prod:0:8080`

Click "Add to ELB".

1. "Listener port": `8080:HTTP`
1. "Target group name": `swagger-prod-tg`

Click "Save" and then "Create Service".

##### *flask-microservices-users*

1. "Task Definition": `flask-microservices-users-prod-td:LATEST_REVISION_NUMBER`
1. "Service name": `flask-microservices-prod-users`
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-prod-alb`
1. "Select a Container": `users-service-prod:0:5000`

Click "Add to ELB".

1. "Listener port": `80:HTTP`
1. "Target group name": `users-prod-tg`

Click "Save" and then "Create Service".

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check (Take One)</span>

Navigate to [Amazon EC2](https://console.aws.amazon.com/ec2/), and click "Target Groups". Make sure `client-prod-tg`, `swagger-prod-tg`, and `users-prod-tg` have a single registered instance each. They should all be healthy.

Then, navigate back to the Load Balancer and grab the "DNS name" from the "Description" tab. Test each in your browser:

1. [http://LOAD_BALANCER_DNS_NAME](http://LOAD_BALANCER_DNS_NAME)
1. [http://LOAD_BALANCER_DNS_NAME/ping](http://LOAD_BALANCER_DNS_NAME/ping)
1. [http://LOAD_BALANCER_DNS_NAME:8080](http://LOAD_BALANCER_DNS_NAME:8080)

Try the `/users` endpoint: [http://LOAD_BALANCER_DNS_NAME/users](http://LOAD_BALANCER_DNS_NAME/users). You should see a 500 error since the migrations have not been ran. To do this, let's SSH into the EC2 instance associated with the `users-prod-tg` Target Group:

```sh
$ ssh -i ~/.ssh/ecs.pem ec2-user@EC2_PUBLIC_IP
```

> You may need to update the permissions on the Pem file - i.e., `chmod 400 ~/.ssh/ecs.pem`.

Next, grab the Container ID for *flask-microservices-users*, enter the shell within the running container, and then update the database:

```sh
$ docker exec -it Container_ID bash
# python manage.py recreate_db
# python manage.py seed_db
```

Navigate to [http://LOAD_BALANCER_DNS_NAME/users](http://LOAD_BALANCER_DNS_NAME/users) again and you should see the users.

Now for the real sanity check - run the e2e tests!

Within, *flask-microservices-main*, set the `TEST_URL` environment variable and then run the tests:

```sh
$ export TEST_URL=LOAD_BALANCER_DNS_NAME
$ testcafe chrome e2e
```

They should pass!

#### <span style="font-family:'Montserrat', 'sans-serif';">Create A Docker Deploy File</span>

Create a new file in *flask-microservices-main* called *docker_deploy_prod.sh*:

```sh
#!/bin/sh

if [ -z "$TRAVIS_PULL_REQUEST" ] || [ "$TRAVIS_PULL_REQUEST" == "false" ]
then

  if [ "$TRAVIS_BRANCH" == "production" ]
  then

    JQ="jq --raw-output --exit-status"

    configure_aws_cli() {
    	aws --version
    	aws configure set default.region us-east-1
    	aws configure set default.output json
    	echo "AWS Configured!"
    }

    register_definition() {
      if revision=$(aws ecs register-task-definition --cli-input-json "$task_def" --family $family | $JQ '.taskDefinition.taskDefinitionArn'); then
        echo "Revision: $revision"
      else
        echo "Failed to register task definition"
        return 1
      fi
    }

    update_service() {
      if [[ $(aws ecs update-service --cluster $cluster --service $service --task-definition $revision | $JQ '.service.taskDefinition') != $revision ]]; then
        echo "Error updating service."
        return 1
      fi
    }

    deploy_cluster() {

      cluster="flask-microservices-prod-cluster"

      # users
      family="flask-microservices-users-prod-td"
    	service="flask-microservices-prod-users"
      template="ecs_users_prod_taskdefinition.json"
      task_template=$(cat "ecs/$template")
      task_def=$(printf "$task_template" $AWS_ACCOUNT_ID $AWS_RDS_URI $PRODUCTION_SECRET_KEY)
      echo "$task_def"
      register_definition
      update_service

      # client
      family="flask-microservices-client-prod-td"
    	service="flask-microservices-prod-client"
      template="ecs_client_prod_taskdefinition.json"
      task_template=$(cat "ecs/$template")
      task_def=$(printf "$task_template" $AWS_ACCOUNT_ID)
      echo "$task_def"
      register_definition
      update_service

      # swagger
      family="flask-microservices-swagger-prod-td"
    	service="flask-microservices-prod-swagger"
      template="ecs_swagger_prod_taskdefinition.json"
      task_template=$(cat "ecs/$template")
      task_def=$(printf "$task_template" $AWS_ACCOUNT_ID)
      echo "$task_def"
      register_definition
      update_service

    }

    configure_aws_cli
    deploy_cluster

  fi

fi
```

Compare this file to *docker_deploy.sh*. What are the differences?

#### <span style="font-family:'Montserrat', 'sans-serif';">Update Travis file</span>

Update the `after_success` in *.travis.yml*:

```yaml
after_success:
  - bash ./docker_push.sh
  - bash ./docker_deploy.sh
  - bash ./docker_deploy_prod.sh
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check (Take Two)</span>

Assuming you are still using the `ecs` feature branch, commit and push your code to GitHub. Open a PR against the `production` branch, and then merge the PR once the Travis build passes, to trigger a new build. Once done, you should see a new revision associated with the each Task Definition and the Services should now be running a new Task based on that revision.

Test everything out again, manually and with the e2e tests!

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
