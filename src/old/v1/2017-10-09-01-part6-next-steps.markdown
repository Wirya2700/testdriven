---
title: Next Steps
layout: post
date: 2017-10-09 23:59:59
permalink: part-six-next-steps
intro: false
part: 6
lesson: 11
share: true
---

Well, that's it. It's your turn! Spend some time refactoring and dealing with tech debt on your own...

1. **More tests**: Increase the overall test coverage of each service.
1. **Test the Lambda function**: Try testing with [AWS Serverless Application Model](https://github.com/awslabs/serverless-application-model) (AWS SAM)
1. **Message queue**: Add a simple message queue - like [Redis Queue](http://python-rq.org/) or [RabbitMQ](https://www.rabbitmq.com/)
1. **Swagger**: The API documentation is way out of date. Update it!
1. **Exercise component state**: What happens if a user submits an exercise and then closes the browser before it's complete? Also, how would you indicate to the end user that they have already submitted an exercise?
1. **DRY out the code**: There's plenty of places in the code base that could be refactored. Did you notice that we could clean up the exercise status message (grading, incorrect, correct) logic by organizing it into a single method? Try this on your own.
1. **Summary table**: How about adding a summary table for individual user scores? Maybe individual users could just view their own scores while an admin can view all user scores.

It's also a great time to pause, review the code, and write more unit,  integration, and end-to-end tests. Do this on your own to check your understanding.

> Want feedback on your code? Shoot an email to `michael@mherman.orf` with a link to the GitHub repo. Cheers!
