---
title: Swagger Setup
layout: post
date: 2017-06-28 23:59:59
permalink: part-four-swagger-setup
intro: false
part: 4
lesson: 7
share: true
---

In this lesson, we'll document the user-service API with [Swagger](https://swagger.io/)...

---

Swagger is a [specification](https://swagger.io/specification/) for describing, producing, consuming, testing, and visualizing a RESTful API. It comes packed with a number of [tools](https://swagger.io/tools/) for automatically generating documentation based on a given endpoint. The focus of this lesson will be on one of those tools - [Swagger UI](https://swagger.io/swagger-ui/), which is used to build client-side API docs.

> New to Swagger? Review the [What Is Swagger?](https://swagger.io/docs/specification/what-is-swagger/) guide from the official documentation.

#### <span style="font-family:'Montserrat', 'sans-serif';">New Container</span>

Let's set up a new service for this. Create a new project and init a new Git repo:

```sh
$ mkdir flask-microservices-swagger && cd flask-microservices-swagger
$ git init
```

Next, add a new *Dockerfile*, to pull in the [Swagger UI](https://hub.docker.com/r/swaggerapi/swagger-ui/tags/) image from [Docker Hub](https://hub.docker.com/):

```
FROM swaggerapi/swagger-ui:v3.0.8
```

Add the new service to the *docker-compose.yml* file in *flask-microservices-main*:

```yaml
swagger:
  container_name: swagger
  build:
    context: ../flask-microservices-swagger
  ports:
    - '8080:8080' # expose ports - HOST:CONTAINER
  depends_on:
    users-service:
      condition: service_started
```

Spin up the new container:

```sh
$ docker-compose up -d --build
```

Once up, ensure you can see the sample API docs ([Swagger Petstore](http://petstore.swagger.io/)) in your browser at [http://DOCKER_MACHINE_DEV_IP:8080/](http://DOCKER_MACHINE_DEV_IP:8080/).

Now, we simply need to provide our own custom [spec file](https://swagger.io/specification/). We could add additional logic to the Flask app, to automatically generate the spec from the route handlers, but this is quite a bit of work. For now, let's just create this file by hand, based on the following routes:

| Endpoint        | HTTP Method | Authenticated?  | Active?   | Admin? |
|-----------------|-------------|-----------------|-----------|--------|
| /auth/register  | POST        | No              | N/A       | N/A    |
| /auth/login     | POST        | No              | N/A       | N/A    |
| /auth/logout    | GET         | Yes             | Yes       | No     |
| /auth/status    | GET         | Yes             | Yes       | No     |
| /users          | GET         | No              | N/A       | N/A    |
| /users/:id      | GET         | No              | N/A       | N/A    |
| /users          | POST        | Yes             | Yes       | Yes    |
| /ping           | GET         | No              | N/A       | N/A    |

Add a *swagger.json* file to *flask-microservices-swagger*:

```json
{
  "swagger": "2.0",
  "info": {
    "version": "0.0.1",
    "title": "Users Service",
    "description": "Swagger spec for documenting the users service"
  },
  "host": "192.168.99.100",
  "schemes": [
    "http"
  ],
  "paths": {
  },
  "definitions": {
  }
}
```

Replace `192.168.99.100` with your local `DOCKER_MACHINE_DEV_IP`.

Here, we defined some basic metadata about the users-service API. Be sure to review the official [spec](https://swagger.io/specification/) documentation for more info.

Commit your code and push it to GitHub.

Then grab the raw JSON URL. For example: https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger.json

> The configuration file can be written in YAML as well - i.e., *swagger.yaml*. The [JSON to YAML](https://www.json2yaml.com/) online convertor can be used to convert the examples to YAML.

Add it as an environment variable in *docker-compose.yml*:

```yaml
swagger:
  container_name: swagger
  build:
    context: ../flask-microservices-swagger
  ports:
    - '8080:8080' # expose ports - HOST:CONTAINER
  environment:
    - API_URL=https://raw.githubusercontent.com/realpython/flask-microservices-swagger/master/swagger.json
  depends_on:
    users-service:
      condition: service_started
```

Update the container. Test it out in the browser.

#### <span style="font-family:'Montserrat', 'sans-serif';">Unauthenticated Routes</span>

Add each of these as properties to the `paths` object in the *swagger.json* file...

`/ping`:

```json
"/ping": {
  "get": {
    "description": "Just a sanity check",
    "produces": [
      "application/json"
    ],
    "responses": {
      "200": {
        "description": "Will return 'pong!'"
      }
    }
  }
}
```

`/users`:

```json
"/users": {
  "get": {
    "description": "Returns all users",
    "produces": [
      "application/json"
    ],
    "responses": {
      "200": {
        "description": "user object"
      }
    }
  }
}
```

`/users/:id`:

```json
"/users/{id}": {
  "get": {
    "description": "Returns a user based on a single user ID",
    "produces": [
      "application/json"
    ],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "description": "ID of user to fetch",
        "required": true,
        "type": "integer",
        "format": "int64"
      }
    ],
    "responses": {
      "200": {
        "description": "user object"
      }
    }
  }
}
```

`/auth/register`:

```json
"/auth/register": {
  "post": {
    "description": "Creates a new user",
    "produces": [
      "application/json"
    ],
    "parameters": [
      {
        "name": "user",
        "in": "body",
        "description": "User to add",
        "required": true,
        "schema": {
          "type": "object",
          "required": [
            "username",
            "email",
            "password"
          ],
          "properties": {
            "username": {
              "type": "string"
            },
            "email": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          }
        }
      }
    ],
    "responses": {
      "200": {
        "description": "user object"
      }
    }
  }
}
```

`/auth/login`:

```json
"/auth/login": {
  "post": {
    "description": "Logs a user in",
    "produces": [
      "application/json"
    ],
    "parameters": [
      {
        "name": "user",
        "in": "body",
        "description": "User to log in",
        "required": true,
        "schema": {

        }
      }
    ],
    "responses": {
      "200": {
        "description": "Successfully logged in"
      }
    }
  }
}
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Schemas</span>

To keep things DRY, let's abstract out the schema definitions via a [reference object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#referenceObject). Add a new schema to the `definitions`:

```json
"definitions": {
  "User": {
    "type": "object",
    "required": [
      "username",
      "email",
      "password"
    ],
    "properties": {
      "username": {
        "type": "string"
      },
      "email": {
        "type": "string"
      },
      "password": {
        "type": "string"
      }
    }
  }
}
```

Now, turn back to the `/auth/register` and `/auth/login` routes and update the `schema` like so:

```json
"schema": {
  "$ref": "#/definitions/User"
}
```

This schema definition can now be reused.

#### <span style="font-family:'Montserrat', 'sans-serif';">Authenticated Routes</span>

To access authenticated routes, we need to add a [Bearer token](https://stackoverflow.com/questions/25838183/what-is-the-oauth-2-0-bearer-token-exactly) to the request header. Unfortunately, Swagger does not currently support this out of the box. There is a workaround though.

Start by adding a [securityDefinitions](https://swagger.io/specification/#securityDefinitionsObject) object to the *swagger.json* file:

```json
{
  "swagger": "2.0",
  "info": {
    "version": "0.0.1",
    "title": "Users Service",
    "description": "Swagger spec for documenting the users service"
  },
  "host": "192.168.99.100",
  "schemes": [
    "http"
  ],
  "securityDefinitions": {
    "Bearer": {
      "type": "apiKey",
      "name": "Authorization",
      "in": "header"
    }
  },
  ...
}
```

Now, we can provide a security property to paths that require authentication...

`/auth/status`:

```json
"/auth/status": {
  "get": {
    "description": "Returns the logged in user's status",
    "produces": [
      "application/json"
    ],
    "security": [
      {
        "Bearer": []
      }
    ],
    "responses": {
      "200": {
        "description": "user object"
      }
    }
  }
}
```

`/auth/logout`:

```json
"/auth/logout": {
  "get": {
    "description": "Logs a user out",
    "produces": [
      "application/json"
    ],
    "security": [
      {
        "Bearer": []
      }
    ],
    "responses": {
      "200": {
        "description": "Successfully logged out"
      }
    }
  }
}
```

Update the container. To test, first log a user in and grab the provided token. Then click the "Authorize" button at the top of the page and add the token to the input box like so:

```
Bearer PROVIDED_TOKEN
```

Finally, for the `/users` route, since we already defined a `users` path, we can just add a new request method to the current object:

```json
"/users": {
  "get": {
    "description": "Returns all users",
    "produces": [
      "application/json"
    ],
    "responses": {
      "200": {
        "description": "user object"
      }
    }
  },
  "post": {
    "description": "Adds a new user",
    "produces": [
      "application/json"
    ],
    "parameters": [
      {
        "name": "user",
        "in": "body",
        "description": "User to add",
        "required": true,
        "schema": {
          "$ref": "#/definitions/User"
        }
      }
    ],
    "security": [
      {
        "Bearer": []
      }
    ],
    "responses": {
      "200": {
        "description": "User added"
      }
    }
  }
},
```

Remember: To test this route, you will need to be authenticated as an admin.

#### <span style="font-family:'Montserrat', 'sans-serif';">Next Steps</span>

Before moving on, add error handling to the `responses` for each path, based on the actual error responses from the users service.

Commit and push your code.
