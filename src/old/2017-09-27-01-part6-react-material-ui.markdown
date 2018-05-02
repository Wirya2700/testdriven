---
title: React Material UI
layout: post
date: 2017-09-27 23:59:59
permalink: part-six-react-material-ui
share: true
---

In this lesson, we'll add Bootstrap 4 to the React front-end...

---

Coming soon!

#### <span style="font-family:'Montserrat', 'sans-serif';">Getting Started</span>

Material UI is a set of React components that implement [Material Design](https://material.io/guidelines/material-design/introduction.html). If you prefer Bootstrap, you are more than welcoem to stick with it.

Within *flask-microservices-client*, install [Material UI](http://www.material-ui.com/):

```sh
$ npm install --save material-ui@1.0.0-beta.12
```

As [suggested](https://material-ui-1dab0.firebaseapp.com/getting-started/installation/#roboto-font), let's also grab the [Roboto](https://fonts.google.com/specimen/Roboto) font.

Add it to a new file called *main.css* in the "public" folder:

```css
html {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

Then add the font along with the *main.css* to *public/index.html* in the `head`:

```html
<link
  href="//fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet"
>
<link rel="stylesheet" href="main.css">
```

Make sure you remove the following line since we're not longer using the Bootstrap styles:

```html
<link
  href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
  rel="stylesheet"
>
```

#### <span style="font-family:'Montserrat', 'sans-serif';">Navbar</span>


Coming soon!

1. Material CSS
1. Evaluation with AWS Lambda
1. Material CSS
