# Todo

1. Add course page
1. Paywall
1. Add microservices intro, from readme, to part 1
1. Autotweet when updates are made?
1. Add testimonials/reviews
1. Refactor side and content to single `<ul></ul>`

# Test Driven Development Courses

## Microservices

- Complexity shifts from the inside (code, vertical stack) to the outside (platform, horizontal stack), managing each dependency, which *can* be good if you have a younger team in terms of developers. Junior developers are free to experiment and muck up smaller apps. You must have solid dev ops support though. Smaller learning curve for new team members.
- Less coupling, which makes scaling easier
- Flexible - different apps can have different code bases and dependencies
- Can be slower since multiple requests and responses are often required
- Smaller code base, less coupled, solid API design, not having to understand the full system = easier to read code
- Smaller code bases are easier to test and maintain (upgrades can be done in pieces)
- Less coupling results in less bugs
- Zero downtime deployments
- More resilient to server crashes
- Easier to integrate new languages and technologies
- Can be slower than a monolith if it requires multiple HTTP requests
- Speed up release cycles


> More: http://flagzeta.org/blog/a-python-microservice-stack/

### Stateful vs stateless services

- Stateful - databases, message queues, service discovery
- Stateless - apps

Stateful containers should not come down. You should limit the number of these since they are hard to scale.

### What code is common amongst all the services?

Generator for-

1. Auth
1. service discovery
1. RESTful routes
1. Unit and Integration test boilerplate
1. Config (via environment variables)
