---
title: React and Docker
layout: post
permalink: part-two-react-and-docker
intro: false
part: 2
lesson: 7
share: true
---

Let's containerize the React app...

---

### Refactor

Before we start, let's refactor the project structure.

Add a new folder to the project root called "services", and then add the "client", "nginx", and "users-service" directory to that folder. Then, rename the "users-service" directory to just "users".

Update *docker-compose-dev.yml*:

```yaml
version: '3.3'

services:

  users-service:
    container_name: users-service
    build:
      context: ./services/users
      dockerfile: Dockerfile-dev
    volumes:
      - './services/users:/usr/src/app'
    ports:
      - 5001:5000
    environment:
      - APP_SETTINGS=project.config.DevelopmentConfig
      - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_dev
      - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
    depends_on:
      - users-db
    links:
      - users-db

  users-db:
    container_name: users-db
    build:
      context: ./services/users/project/db
      dockerfile: Dockerfile
    ports:
      - 5435:5432
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres

  nginx:
    container_name: nginx
    build: ./services/nginx
    restart: always
    ports:
      - 80:80
    depends_on:
      - users-service
    links:
      - users-service
```

Update *docker-compose-prod.yml* as well:

```yaml
version: '3.3'

services:

  users-service:
    container_name: users-service
    build:
      context: ./services/users
      dockerfile: Dockerfile-prod
    expose:
      - '5000'
    environment:
      - APP_SETTINGS=project.config.ProductionConfig
      - DATABASE_URL=postgres://postgres:postgres@users-db:5432/users_prod
      - DATABASE_TEST_URL=postgres://postgres:postgres@users-db:5432/users_test
    depends_on:
      - users-db
    links:
      - users-db

  users-db:
    container_name: users-db
    build:
      context: ./services/users/project/db
      dockerfile: Dockerfile
    ports:
      - 5435:5432
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres

  nginx:
    container_name: nginx
    build: ./services/nginx
    restart: always
    ports:
      - 80:80
    depends_on:
      - users-service
    links:
      - users-service
```

Set `testdriven-dev` as the active Docker Machine:

```sh
$ docker-machine env testdriven-dev
$ eval $(docker-machine env testdriven-dev)
```

Update the containers:

```sh
$ docker-compose -f docker-compose-dev.yml up -d
```

Ensure the app is working in the browser, and then run the tests:

```sh
$ docker-compose -f docker-compose-dev.yml \
  run users-service python manage.py test
```

### Local Development

Add *Dockerfile-dev* to the root of the "client" directory, making sure to review the code comments:

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
RUN npm install react-scripts@1.0.15 -g --silent

# start app
CMD ["npm", "start"]
```

> Silencing the NPM output via `--silent` is a personal choice. It’s often frowned upon, though, since it can swallow errors. Keep this in mind so you don’t waste time debugging.

Then, add the new service to the *docker-compose-dev.yml* file like so:

```
client:
  container_name: client
  build:
    context: ./services/client
    dockerfile: Dockerfile-dev
  volumes:
    - './services/client:/usr/src/app'
  ports:
    - '3007:3000'
  environment:
    - NODE_ENV=development
    - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
  depends_on:
    - users-service
  links:
    - users-service
```

In the terminal, make sure `testdriven-dev` is the active machine and then add the valid environment variable:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

Build the image and fire up the new container:

```sh
$ docker-compose -f docker-compose-dev.yml up --build -d client
```

Run the client-side tests:

```sh
$ docker-compose -f docker-compose-dev.yml run client npm test
```

Navigate to [http://DOCKER_MACHINE_DEV_IP:3007/](http://DOCKER_MACHINE_DEV_IP:3007/) in your browser to test the app.

What happens if you navigate to the main route? Since we're still routing traffic to the Flask app (via Nginx), you will see the old app, served up with server-side templating. We need to update the Nginx configuration to route traffic to that main route to the React app.

Update *services/nginx/flask.conf*:

```
server {

  listen 80;

  location / {
    proxy_pass http://client:3000;
    proxy_redirect    default;
    proxy_set_header  Host $host;
    proxy_set_header  X-Real-IP $remote_addr;
    proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header  X-Forwarded-Host $server_name;
  }

  location /users {
    proxy_pass        http://users-service:5000;
    proxy_redirect    default;
    proxy_set_header  Host $host;
    proxy_set_header  X-Real-IP $remote_addr;
    proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header  X-Forwarded-Host $server_name;
  }

}
```

What's happening?

1. The `location` blocks define the [reverse proxies](https://www.nginx.com/resources/glossary/reverse-proxy-server/).
1. When a requested URI matches the URI in a location block, Nginx passes the request either to the Create React App development server (serving the React app) or to the Flask development server (serving up the Flask app).

Also, `client` needs to spin up before `nginx`, so update *docker-compose-dev.yml*:

```
nginx:
  container_name: nginx
  build: ./services/nginx
  restart: always
  ports:
    - 80:80
  depends_on:
    - users-service
    - client
  links:
    - users-service
```

Update the containers (via `docker-compose -f docker-compose-dev.yml up -d --build`) and then test the app out in the browser:

1. [http://DOCKER_MACHINE_DEV_IP/](http://DOCKER_MACHINE_IP/)
1. [http://DOCKER_MACHINE_DEV_IP/users](http://DOCKER_MACHINE_IP/users)

We can also take advantage of auto-reload since we set up a volume. To test, fire up the [logs](https://docs.docker.com/compose/reference/logs/):

```sh
$ docker-compose -f docker-compose-dev.yml logs -f
```

Clear the terminal screen, and then change the state object in the `App` component:

```javascript
this.state = {
  users: [],
  username: 'justatest',
  email: ''
};
```

As soon as you save, you should see the app re-compile and the browser should refresh on its own:

<div style="text-align:left;">
  <img src="/assets/img/course/02_react_docker_auto_reload.png" style="max-width: 100%; border:0; box-shadow: none;" alt="react docker auto reload">
</div>

Make sure to change the state back before moving on.

> Having problems getting auto-reload to work properly with Docker Machine and VirtualBox?
> 1. Try [enabling](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#troubleshooting) a polling mechanism via [chokidar](https://github.com/paulmillr/chokidar) by adding the following environment variable key/pair to the *docker-compose-dev.yml* file - `CHOKIDAR_USEPOLLING=true`. Review [Dockerizing a React App](http://mherman.org/blog/2017/12/07/dockerizing-a-react-app) for more info.
> 2. Try [reseting](https://stackoverflow.com/questions/30550742/how-do-i-undo-the-command-eval-docker-machine-env-blog/33251637#33251637) the Docker environment back to localhost. Rebuild the images, spin up the containers, and test auto-reload again.

### Create React App Build

Before updating the production environment, let's create a [build](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment) with Create React App locally, outside of Docker, which will generate static files.

Make sure the `REACT_APP_USERS_SERVICE_URL` environment variable is set:

```sh
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_DEV_IP
```

> All environment variables are [embedded](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-custom-environment-variables
) into the app at build time. Keep this in mind.

Then run the `build` command from the "services/client" directory:

```sh
$ npm run build
```

You should see a "build" directory, with "services/client", with the static files. We need to serve this up with a basic web server. Let's use the [HTTP server](https://docs.python.org/3/library/http.server.html#module-http.server) from the standard library. Navigate to the "build" directory, and then run the server:

```sh
$ python3 -m http.server
```

This will serve up the app on [http://localhost:8000/](http://localhost:8000/). Test it out in the browser to make sure it works. Once done, kill the server and navigate back to the project root.

### Production

Add *Dockerfile-prod* to the root of the "client" directory:

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
CMD ["pushstate-server", "build", "3000"]
```

When the image is built, we can pass arguments to the *Dockerfile*, via the [ARG](https://docs.docker.com/engine/reference/builder/#arg) instruction, which can then be used as environment variables. `npm run build` will generate static files that are served up on port 3000 via the [pushstate-server](https://www.npmjs.com/package/pushstate-server).

Let's test it without Docker Compose.

First, from "services/client", build the image, making sure to use the `--build-arg` flag to pass in the appropriate arguments:

```sh
$ docker build -f Dockerfile-prod -t "test" ./ \
  --build-arg NODE_ENV=development \
  --build-arg REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_PROD_IP
```

> Make sure to replace `DOCKER_MACHINE_PROD_IP` with your actual IP.

This uses the *Dockerfile-prod* file found in "services/client", `./`, to build a new image called `test` with the required build arguments.

> You can view all images by running `docker image`.

Spin up the container from the `test` image, mapping port 3000 in the container to port 9000 outside the container:

```sh
$ docker run -d -p 9000:3000 test
```

Navigate to [http://localhost:9000/](http://localhost:9000/) in your browser to test.

Once done, grab the container ID by running `docker ps`, and then view the container's environment variables:

```sh
$ docker exec CONTAINER_ID bash -c 'env'
```

Stop and remove the container:

```sh
$ docker stop CONTAINER_ID
$ docker rm CONTAINER_ID
```

Finally, remove the image:

```sh
$ docker rmi test
```

With the *Dockerfile-prod* file set up and tested, add the service to *docker-compose-prod.yml*:

```yaml
client:
  container_name: client
  build:
    context: ./services/client
    dockerfile: Dockerfile-prod
    args:
      - NODE_ENV=development
      - REACT_APP_USERS_SERVICE_URL=${REACT_APP_USERS_SERVICE_URL}
  ports:
    - '3007:3000'
  depends_on:
    - users-service
  links:
    - users-service
```

So, instead of passing `NODE_ENV` and `REACT_APP_USERS_SERVICE_URL` as environment variables, which happens at runtime, we defined them as build arguments.

Again, `client` needs to spin up before `nginx`, so update *docker-compose-prod.yml*:

```
nginx:
  container_name: nginx
  build: ./services/nginx
  restart: always
  ports:
    - 80:80
  depends_on:
    - users-service
    - client
  links:
    - users-service
```

To update production, set the `testdriven-prod` machine as the active machine, change the `REACT_APP_USERS_SERVICE_URL` environment variable to the IP associated with the `testdriven-prod` machine, and update the containers:

```sh
$ docker-machine env testdriven-prod
$ eval $(docker-machine env testdriven-prod)
$ export REACT_APP_USERS_SERVICE_URL=http://DOCKER_MACHINE_AWS_IP
$ docker-compose -f docker-compose-prod.yml up -d --build
```

> Remember: Since the environment variables are added at build time, if you update the variables, you *will* have to rebuild the Docker image.

Check the environment variables:

```sh
$ docker-compose -f docker-compose-prod.yml \
  run client env
```

### Travis

One more thing: Add the `REACT_APP_USERS_SERVICE_URL` environment variable to the *.travis.yml* file, within the `before_script`:

```yaml
before_script:
  - export REACT_APP_USERS_SERVICE_URL=http://127.0.0.1
```

Commit and push your code to GitHub. Ensure the Travis build passes before moving on.
