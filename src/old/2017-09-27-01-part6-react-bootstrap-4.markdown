---
title: React Bootstrap 4
layout: post
date: 2017-09-27 23:59:59
permalink: part-six-react-bootstrap-4
share: true
---

In this lesson, we'll add Bootstrap 4 to the React front-end...

---

Coming soon!

#### <span style="font-family:'Montserrat', 'sans-serif';">Getting Started</span>

Bootstrap 4 is [rewrite](https://getbootstrap.com/docs/4.0/migration/) of the Bootstrap project. In the end, it's a better framework, but if you prefer Bootstrap 3, you are more than welcome to stick with it.

> Curious about the differences between Bootstrap 3 and 4? Check out the excellent [Bootstrap 4: What's New](https://medium.com/wdstack/bootstrap-4-whats-new-visual-guide-c84dd81d8387) blog post.

Within *flask-microservices-client*, install [reactstrap](https://reactstrap.github.io/), a Bootstrap 4 React component library, along with the peer dependencies:

```sh
$ npm install --save reactstrap@4.8.0 \
  react-addons-transition-group@15.6.2 \
  react-addons-css-transition-group@15.6.2
```

Install Bootstrap [4.0.0-alpha.6](https://github.com/twbs/bootstrap/releases/tag/v4.0.0-alpha.6):

```sh
$ npm install bootstrap@4.0.0-alpha.6 --save
```

Import Bootstrap in the *src/index.js* file:

```javascript
import 'bootstrap/dist/css/bootstrap.css';
```

Make sure you remove the following line from the `head` in *public/index.html* since we're not longer using the Bootstrap 3 styles anymore:

```html
<link
  href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
  rel="stylesheet"
>
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Navbar</span>

#### <span style="font-family:'Montserrat', 'sans-serif';">Table</span>

Coming soon!

1. Material CSS
1. Evaluation with AWS Lambda
1. Material CSS
