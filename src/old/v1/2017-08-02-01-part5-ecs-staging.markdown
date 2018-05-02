---
title: ECS Staging
layout: post
date: 2017-08-02 23:59:59
permalink: part-five-ec2-container-service-staging
intro: false
part: 5
lesson: 6
share: true
---

Let's get the rest of the services up and running on ECS...

---

#### <span style="font-family:'Montserrat', 'sans-serif';">Remove Resources</span>

Start by remove the current AWS resources, in the following order:

1. Load Balancer: `flask-microservices-staging`
1. Target Group: `sample`
1. Cluster: `flask-microservices-staging`

#### <span style="font-family:'Montserrat', 'sans-serif';">ALB</span>

Navigate to [Amazon EC2](https://console.aws.amazon.com/ec2/), click "Load Balancers" on the sidebar, and then click the "Create Load Balancer" button. Select "Application Load Balancer".

"Step 1: Configure Load Balancer":

1. "Name": `flask-microservices-staging-alb`
1. "Availability Zones": `us-east-1a`, `us-east-1b`

"Step 2: Configure Security Settings":

1. Skip this step for now

"Step 3: Configure Security Groups":

1. Select an existing security group or create a new security group, making sure at least HTTP 80 and SSH 22 are open.

"Step 4: Configure Routing":

1. "Name": `client-tg`
1. "Port": `9000`
1. "Path": `/`

"Step 5: Register Targets":

1. We don't need to assign any instances manually since this will be managed by ECS.

#### <span style="font-family:'Montserrat', 'sans-serif';">Target Groups</span>

Next, we need to set up new Target Groups for `swagger` and `users-service`. Within [Amazon EC2](https://console.aws.amazon.com/ec2/), click "Target Groups", and then create the following Target Groups:

##### Target Group 1: *flask-microservices-users*

1. "Target group name": `users-tg`
1. "Port": `5000`

Then, under "Health check settings":

1. "Path": `/ping`

##### Target Group 2: *flask-microservices-swagger*

1. "Target group name": `swagger-tg`
1. "Port": `8080`

Then, under "Health check settings":

1. "Path": `/`

#### <span style="font-family:'Montserrat', 'sans-serif';">Update ALB</span>

Back on the "Load Balancers" page, click the `flask-microservices-staging-alb` Load Balancer, and then select the "Listeners" tab. Here, we can add [Listeners](http://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html) to the ALB, which are then forwarded to a specific Target Group.

There should already be a listener for "HTTP : 80". Click the "View/edit rules >" link, and then insert four new rules:

1. If `/auth/*`, Then `users-tg`
1. If `/users`, Then `users-tg`
1. If `/users/*`, Then `users-tg`
1. If `/ping`, Then `users-tg`

Add a new listener:

1. "Protocol": `HTTP`
1. "Port": `8080`
1. "Default target group": `swagger-tg`

#### <span style="font-family:'Montserrat', 'sans-serif';">Cluster</span>

Navigate back to ECS, and create a new Cluster:

1. "Cluster name": `flask-microservices-staging-cluster`
1. "EC2 instance type": `t2.micro`
1. "Number of instances": `6`
1. "Key pair": `ecs`

Make sure to pick the "VPC" and "Security group" associated with ALB. Select one of the available "Subnets" as well - either `us-east-1a` or `us-east-1b`.

#### <span style="font-family:'Montserrat', 'sans-serif';">Task Definitions</span>

Create the following Task Definitions...

##### *flask-microservices-client*

1. "Task Definition Name": `flask-microservices-client-td`
1. Container:
  1. "Container name": `client`
  1. "Image": `YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/flask-microservices-client:staging`
  1. "Memory Limits (MB)": `300` soft limit
  1. "Port mappings": `0` host, `9000` container
  1. "Env Variables":
      - `NODE_ENV` - `staging`
      - `REACT_APP_USERS_SERVICE_URL` - http://LOAD_BALANCER_DNS_NAME

##### *flask-microservices-swagger*

1. "Task Definition Name": `flask-microservices-swagger-td`
1. Container:
  1. "Container name": `swagger`
  1. "Image": `YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/flask-microservices-swagger:staging`
  1. "Memory Limits (MB)": `300` soft limit
  1. "Port mappings": `0` host, `8080` container
  1. "Env Variables":
      - `API_URL` - `https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger.json`

##### *flask-microservices-users*

Since the containers are already set up for this under the `testdriven-staging` Task Definition, we can just rename it. Create a new revision of `testdriven-staging` Task Definition, changing the name to `flask-microservices-users-td`. This will actually create a new Task Definition.

#### <span style="font-family:'Montserrat', 'sans-serif';">Services</span>

Create the following Services...

##### *flask-microservices-client*

1. "Task Definition": `flask-microservices-client-td:LATEST_REVISION_NUMBER`
1. "Service name": `flask-microservices-staging-client`
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-staging-alb`
1. "Select a Container": `client:0:9000`

Click "Add to ELB".

1. "Listener port": `80:HTTP`
1. "Target group name": `client-tg`

Click "Save" and then "Create Service".

##### *flask-microservices-swagger*

1. "Task Definition": `flask-microservices-swagger-td:LATEST_REVISION_NUMBER`
1. "Service name": `flask-microservices-staging-swagger`
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-staging-alb`
1. "Select a Container": `swagger:0:8080`

Click "Add to ELB".

1. "Listener port": `8080:HTTP`
1. "Target group name": `swagger-tg`

Click "Save" and then "Create Service".

##### *flask-microservices-users*

1. "Task Definition": `flask-microservices-users-td:LATEST_REVISION_NUMBER`
1. "Service name": `flask-microservices-staging-users`
1. "Number of tasks": `1`

Click "Configure ELB".

1. "ELB Name": `flask-microservices-staging-alb`
1. "Select a Container": `users-service:0:5000`

Click "Add to ELB".

1. "Listener port": `80:HTTP`
1. "Target group name": `users-tg`

Click "Save" and then "Create Service".

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check</span>

Navigate to [Amazon EC2](https://console.aws.amazon.com/ec2/), and click "Target Groups". Make sure `client-tg`, `swagger-tg`, and `users-tg` have a single registered instance each. They should all be healthy.

Then, navigate back to the Load Balancer and grab the "DNS name" from the "Description" tab. Test each in your browser:

1. [http://LOAD_BALANCER_DNS_NAME/](http://LOAD_BALANCER_DNS_NAME/)
1. [http://LOAD_BALANCER_DNS_NAME/ping](http://LOAD_BALANCER_DNS_NAME/ping)
1. [http://LOAD_BALANCER_DNS_NAME/users](http://LOAD_BALANCER_DNS_NAME/users)
1. [http://LOAD_BALANCER_DNS_NAME:8080](http://LOAD_BALANCER_DNS_NAME:8080)

Now for the real sanity check - run the e2e tests!

Within, *flask-microservices-main*, set the `TEST_URL` environment variable and then run the tests:

```sh
$ export TEST_URL=LOAD_BALANCER_DNS_NAME
$ testcafe chrome e2e
```

They should pass!

#### <span style="font-family:'Montserrat', 'sans-serif';">Swagger URL</span>

Did you test any of the endpoints from the Swagger UI at [http://LOAD_BALANCER_DNS_NAME:8080](http://LOAD_BALANCER_DNS_NAME:8080)? They all should break since the `host` within the *swagger.json* file needs to be updated.

Update this within *flask-microservices-swagger*, commit, and push the changes up to GitHub. Test it again in your browser.

#### <span style="font-family:'Montserrat', 'sans-serif';">Travis Update</span>

Before moving on, we need to update the CI workflow to handle the new Task Definitions and Services...

##### (1) *docker_push.sh*

First, within *flask-microservices-main*, update the `REACT_APP_USERS_SERVICE_URL` environment variable for `staging`:

```sh
if [ "$TRAVIS_BRANCH" == "staging" ]
then
  export REACT_APP_USERS_SERVICE_URL="LOAD_BALANCER_DNS_NAME"
  export SECRET_KEY="my_precious"
fi
```

##### (2) Task Definition Files

Next, create a new folder called "ecs" to house the Task Definition JSON files...

*ecs_client_taskdefinition.json*:

```json
{
  "containerDefinitions": [
    {
      "name": "client",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-client:staging",
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
          "value": "staging"
        },
        {
          "name": "REACT_APP_USERS_SERVICE_URL",
          "value": "http://LOAD_BALANCER_DNS_NAME"
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

*ecs_swagger_taskdefinition.json*:

```json
{
  "containerDefinitions": [
    {
      "name": "swagger",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-swagger:staging",
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
          "value": "https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger.json"
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

*ecs_users_taskdefinition.json*:

```json
{
  "containerDefinitions": [
    {
      "name": "users-service",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-users:staging",
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
          "value": "postgres://postgres:postgres@users-db:5432/users_test"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgres://postgres:postgres@users-db:5432/users_staging"
        },
        {
          "name": "SECRET_KEY",
          "value": "my_precious"
        }
      ],
      "links": [
        "users-db"
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
      "name": "users-db",
      "image": "%s.dkr.ecr.us-east-1.amazonaws.com\/flask-microservices-users_db:staging",
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

You can remove the *ecs_taskdefinition.json* file in the project root.

##### (3) *docker_deploy.sh*

```sh
#!/bin/sh

if [ -z "$TRAVIS_PULL_REQUEST" ] || [ "$TRAVIS_PULL_REQUEST" == "false" ]
then

  if [ "$TRAVIS_BRANCH" == "staging" ]
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

      cluster="flask-microservices-staging-cluster"

      # users
      family="flask-microservices-users-td"
    	service="flask-microservices-staging-users"
      template="ecs_users_taskdefinition.json"
      task_template=$(cat "ecs/$template")
      task_def=$(printf "$task_template" $AWS_ACCOUNT_ID $AWS_ACCOUNT_ID)
      echo "$task_def"
      register_definition
      update_service

      # client
      family="flask-microservices-client-td"
    	service="flask-microservices-staging-client"
      template="ecs_client_taskdefinition.json"
      task_template=$(cat "ecs/$template")
      task_def=$(printf "$task_template" $AWS_ACCOUNT_ID)
      echo "$task_def"
      register_definition
      update_service

      # swagger
      family="flask-microservices-swagger-td"
    	service="flask-microservices-staging-swagger"
      template="ecs_swagger_taskdefinition.json"
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

#### <span style="font-family:'Montserrat', 'sans-serif';">Sanity Check (Take Two)</span>

Assuming you are still using the `ecs` feature branch, commit and push your code to GitHub. Open a PR against the `staging` branch, and then merge the PR once the Travis build passes, to trigger a new build. Once done, you should see a new revision associated with the each Task Definition and the Services should now be running a new Task based on that revision.

Test everything out again, manually and with the e2e tests!
