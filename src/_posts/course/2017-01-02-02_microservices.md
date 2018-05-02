---
title: Microservices
layout: post
permalink: part-one-microservices
intro: false
part: 1
lesson: 2
share: true
---

Microservice architecture provides a means of breaking apart large applications into smaller services that interact and communicate with each another. Communication between the services usually happens over a network connection through HTTP calls. [Web sockets](https://en.wikipedia.org/wiki/WebSocket), [message queues](https://en.wikipedia.org/wiki/Message_queue) and [remote procedure calls](https://en.wikipedia.org/wiki/Remote_procedure_call) (RPC) can
also be used to connect standalone components.

Each individual service focuses on a single task, generally separated by business unit, and is governed by its RESTful contact.

The goal of this course is to detail one approach to developing an application in the microservice fashion. It's less about the *why* and more about the *how*. Microservices are hard. They present a number of challenges and issues that are very difficult to solve. Keep this in mind before you start breaking apart your monolith.

### Pros

#### Separation of Concerns

With a clear separation between services, developers are free to focus on their own areas of expertise, like languages, frameworks, dependencies, and tools.

For example, a front-end JavaScript engineer could develop the client-facing views without ever having to understand the underlying code in the back-end API. He or she is free to use the languages and frameworks of choice, only having to communicate with the back-end via AJAX requests to consume the RESTful API.

Clear separation means that errors are mostly localized to the service that the developer is working on. So, you can assign a junior developer to a less critical service so that way if she or he brings down that service, the remainder of the application is not affected.

Less coupling also makes scaling easier since each service can be deployed separately.

#### Smaller Code Bases

Smaller code bases tend to be easier to understand since you do not have to grasp the entire system. This, along with the necessity for solid API design, means that applications in a microservice stack are generally easier to work on, test, refactor, and scale.

### Cons

#### Design Complexity

Deciding to split off a piece of your application into a microservice is no easy task. It's often much easier to refactor it into a separate module within the overall monolith rather than splitting it out.

Once you split out a service there is no going back.

#### Network Complexity

With a monolith, generally everything happens in a single process so you don't have to make very many calls to other services. As you break out pieces of your application into microservices, you'll find that you'll now have to make a network call when before you could just call a function.

This can cause problems especially if multiple services need to communicate with one another, resulting in ping-pong-like affect in terms of network requests. You will also have to account for a service going down altogether.

#### Data Persistence

Most applications have some sort of stateful layer, like databases or task queues. Microservice stacks also need to keep track of where services are deployed and the total number of deployed instances, so that when a new instance of a particular service is stood up, traffic can be re-routed appropriately. This is often referred to as [service discovery](https://en.wikipedia.org/wiki/Service_discovery).  

Since we'll be dealing with containers, we need to take special care in how we handle stateful containers since they should not come down.

Isolating a particular service's state so that it is not shared or duplicated is incredible difficult. You'll often have to deal with various sources of truth, which will have to be reconciled frequently. Again, this comes down to design.

#### Integration Tests

Often, when developing applications with a microservice architecture, you cannot fully test out all services until you deploy to a staging or production server. This takes much too long to get feedback. Fortunately, Docker helps to speed up this process by making it easier to link together small, independent services locally.
