---
title: Setting up RDS
layout: post
date: 2017-08-03 23:59:59
permalink: part-five-ec2-relational-database-service
intro: false
part: 5
lesson: 7
share: true
---

Before adding our production Cluster, let's set up Amazon RDS...

---

First off, why should we set up Amazon [Relational Database Service](https://aws.amazon.com/rds/) (RDS)? Why should we not just manage Postgres within the Cluster itself?

1. Since the recommended means of [service discovery](https://en.wikipedia.org/wiki/Service_discovery) in ECS is load balancing, we'll have to register the Postgres instance with the ALB. There's additional costs and overhead associated with this. We'll also have to assign a public IP to it and expose it to the internet. It's best to keep it private.
1. Data integrity is an issue as well. What happens if the container crashes?
1. In the end, you will save time and money using RDS rather than managing your own Postgres instance on a server somewhere

> For more, check out [this](https://www.reddit.com/r/devops/comments/4tt6za/use_aws_ecs_with_docker_for_a_postgres_db_or_aws/) Reddit post.

#### <span style="font-family:'Montserrat', 'sans-serif';">RDS Setup</span>

Navigate to [Amazon RDS](https://console.aws.amazon.com/rds), click "Instances" on the sidebar, and then click the "Launch DB Instance" button.

> You *probably* want to click the "Free tier eligible only". More [info](https://aws.amazon.com/free/).


Select the "PostgreSQL" engine and then "Dev/Test". Under "Specify DB Details":

1. "DB Engine Version": `PostgreSQL 9.6.2-R1`
1. "DB Instance Class": `db.t2.micro`
1. "Multi-AZ Deployment": `No`
1. "Storage Type": `General Purpose (SSD)`
1. "Allocated Storage": `5 GB`
1. "DB Instance Identifier": `flask-microservices-production`
1. "Master Username": `webapp`
1. "Master Password": `something_super_secret`

Click "Next Step". Under "Network & Security", make sure to pick the "VPC" and "Security group" associated with ALB. Select one of the available "Subnets" as well - either `us-east-1a` or `us-east-1b`.

Change the DB name to `users_prod` and then create the new database.

You can quickly check the status via:

```sh
$ aws rds describe-db-instances \
  --db-instance-identifier flask-microservices-production \
  --query 'DBInstances[].{DBInstanceStatus:DBInstanceStatus}'
```

Then, once the status is "available", grab the address:

```sh
$ aws rds describe-db-instances \
  --db-instance-identifier flask-microservices-production \
  --query 'DBInstances[].{Address:Endpoint.Address}'
```

Take note of the production URI:

```
postgres://webapp:YOUR_PASSWORD@YOUR_ADDRESS:5432/users_prod
```

> Keep in mind that you cannot access the DB outside the VPC. So, if you want to connect to the instance, you will need to use [SSH tunneling](https://en.wikipedia.org/wiki/Tunneling_protocol#Secure_Shell_tunneling) via SSHing into an EC2 instance on the same VPC and, from there, connecting to the database.  We'll go through this process in a future lesson.
