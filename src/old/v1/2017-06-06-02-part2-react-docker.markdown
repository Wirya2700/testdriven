---
title: React and Docker
layout: post
date: 2017-06-06 23:59:58
permalink: part-two-react-docker
intro: false
part: 2
lesson: 8
share: true
---

Let's containerize the React app...

---

Navigate to the *flask-microservices-client* directory. Add a *Dockerfile* to the root, making sure to review the code comments:

```
FROM node:latest

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install react-scripts@0.9.5 -g --silent

# add app
ADD . /usr/src/app

# start app
CMD ["npm", "start"]
```

Commit the code and then push it up to GitHub. Then, within *flask-microservices-main*, add the new service to the *docker-compose.yml* file like so:

```
web-service:
  container_name: web-service
  build: https://github.com/realpython/flask-microservices-client.git
  ports:
    - '3007:3000' # expose ports - HOST:CONTAINER
  environment:
    - NODE_ENV=development
    - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
  depends_on:
    users-service:
      condition: service_started
  links:
    - users-service
```

In the terminal, make sure `dev` is the active machine and then add the valid IP to *flask-microservices-main*:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_IP
```

Build the image and fire up the new container:

```sh
$ docker-compose up --build -d web-service
```

Navigate to [http://DOCKER_MACHINE_IP:3007/](http://DOCKER_MACHINE_IP:3007/) in your browser to test the app.

What happens if you navigate to the main route? Since we're still routing traffic to the Flask app (via Nginx), you will see the old app, served up with server-side templating. We need to update the Nginx configuration to route traffic to that main route to the React app. Before we update this, though, let's create a [build](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment) with Create React App locally, outside of Docker, which will generate static files.

#### <span style="font-family:'Montserrat', 'sans-serif';">Create React App Build</span>

Make sure the `REACT_APP_USERS_SERVICE_URL` environment variable is set:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_IP
```

> All environment variables are [embedded](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-custom-environment-variables
) into the app at build time. Keep this in mind.

Then run the `build` command in *flask-microservices-client*:

```sh
$ npm run build
```

You should see a "build" directory with the static files. We need to serve this up with a basic web server. Let's use the [HTTP server](https://docs.python.org/3/library/http.server.html#module-http.server) from the standard library. Navigate to the "build" directory, and then run the server:

```sh
$ python3 -m http.server
```

This will serve up the app on [http://localhost:8000/](http://localhost:8000/). Test it out in the browser to make sure it works. Once done, kill the server and navigate back to the project root.

#### <span style="font-family:'Montserrat', 'sans-serif';">Dockerfile</span>

Update the *Dockerfile*

```
FROM node:latest

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# add environment variables
ARG REACT_APP_USERS_SERVICE_URL
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
ENV REACT_APP_USERS_SERVICE_URL $REACT_APP_USERS_SERVICE_URL

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install pushstate-server -g --silent

# add app
ADD . /usr/src/app

# build react app
RUN npm run build

# start app
CMD ["pushstate-server", "build"]
```

When the image is built, we can pass arguments to the *Dockerfile*, via the [ARG](https://docs.docker.com/engine/reference/builder/#arg) instruction, which can then be used as environment variables. `npm run build` will generate static files that are served up on port 9000 via the [pushstate-server](https://www.npmjs.com/package/pushstate-server).

Let's test it without Docker Compose.

First, build the image, making sure to use the `--build-arg` flag to pass in the appropriate arguments:

```sh
$ docker build -t "test" ./ --build-arg NODE_ENV=development --build-arg REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_IP
```

This uses the *Dockerfile* found in the project root, `./`, to build a new image called `test` with the required build arguments.

> You can view all images by running `docker image`.

Spin up the container from the `test` image, mapping port 9000 in the container to port 9000 outside the container.

```sh
$ docker run -d -p 9000:9000 test
```

Navigate to [http://localhost:9000/](http://localhost:9000/) in your browser to test.

Grab the container ID by running `docker ps`, and then view the container's environment variables:

```sh
$ docker exec CONTAINER_ID bash -c 'env'
```

Once done, stop and remove the container:

```sh
$ docker stop CONTAINER_ID
$ docker rm CONTAINER_ID
```

Finally, remove the image:

```sh
$ docker rmi test
```

Commit and push your code.

#### <span style="font-family:'Montserrat', 'sans-serif';">Docker Compose</span>

With the *Dockerfile* set up and tested, update the `web-service` in *docker-compose.yml*:

```
web-service:
  container_name: web-service
  build:
    context: https://github.com/realpython/flask-microservices-client.git
    args:
      - NODE_ENV=development
      - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
  ports:
    - '9000:9000' # expose ports - HOST:CONTAINER
  depends_on:
    users-service:
      condition: service_started
  links:
    - users-service
```

So, instead of passing `NODE_ENV` and `REACT_APP_USERS_SERVICE_URL` as environment variables, which happens at runtime, we defined them as build arguments.

Update the containers:

```sh
$ docker-compose up -d --build
```

Test it out again at [http://DOCKER_MACHINE_IP:9000/](http://DOCKER_MACHINE_IP:9000/).

> Curious about the environment variables? Run `docker-compose run web-service env` to view them.

With that, let's update Nginx...

#### <span style="font-family:'Montserrat', 'sans-serif';">Nginx</span>

Make the following updates to *flask.conf* in "flask-microservices-main":

```
server {

    listen 80;

    location / {
        proxy_pass http://web-service:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /users {
        proxy_pass http://users-service:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

}
```

What's happening?

1. The `location` blocks define the [reverse proxies](https://www.nginx.com/resources/glossary/reverse-proxy-server/).
1. When a requested URI matches the URI in a location block, Nginx passes the request either to the pushstate-server (serving the React app) or to the WSGI/Guicorn server (serving up the Flask app).

While we're at it, let's update the name from *flask.conf* to *nginx.conf* so it's more relevant. Make sure to update the *Dockerfile* in "flask-microservices-main/nginx" as well:

```
FROM nginx:1.13.0

RUN rm /etc/nginx/conf.d/default.conf
ADD /nginx.conf /etc/nginx/conf.d
```

Update `nginx` in the *docker-compose.yml* file, so that it is linked to the `web-service`:

```
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
```

Update the containers (via `docker-compose up -d --build`) and then test it out in the browser:

1. [http://DOCKER_MACHINE_IP/](http://DOCKER_MACHINE_IP/)
1. [http://DOCKER_MACHINE_IP/users](http://DOCKER_MACHINE_IP/users)

Run the tests again (just for fun!):

```sh
$ docker-compose run users-service python manage.py test
```

Now, let's update production...

#### <span style="font-family:'Montserrat', 'sans-serif';">Update Production</span>

Add the `web-service` to *docker-compose-prod.yml*:

```
web-service:
  container_name: web-service
  build:
    context: https://github.com/realpython/flask-microservices-client.git
    args:
      - NODE_ENV=production
      - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
  ports:
    - '9000:9000' # expose ports - HOST:CONTAINER
  depends_on:
    users-service:
      condition: service_started
  links:
    - users-service
```

Update `nginx` as well:

```
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
```

Set the `aws` machine as the active machine, change the environment variable to the IP associated with the `aws` machine, and update the containers:

```sh
$ docker-machine env aws
$ eval $(docker-machine env aws)
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_AWS_IP
$ docker-compose -f docker-compose-prod.yml up -d --build
```

> Remember: Since the environment variables are added at build time, if you update the variables, you *will* have to rebuild the Docker image.

Test it again, and then commit and push your code.
