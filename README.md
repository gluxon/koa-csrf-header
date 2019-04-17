# Koa CSRF Header Validation

[![Known Vulnerabilities](https://snyk.io/test/github/fkanout/koa-csrf-header/badge.svg)](https://snyk.io/test/github/fkanout/koa-csrf-header)

The [CSRF module provided by Koa's maintainers](#koa-csrf) doesn't support
validating CSRF tokens as an HTTP header field. This package provides that
alternative exclusively.

This method requires client-side JavaScript enabled to craft the AJAX request,
but validating an HTTP header field can be more convenient since your form
templates don't need to be concerned with outputting a hidden field.

This package will be deprecated if the Koa team provided package supports
validation in the header in the future.

## Install

```sh
$ npm install --save koa-csrf-header
```

## Usage

There are multiple ways to store a CSRF token throughout a user session. There
are also multiple ways to send a CSRF token downstream. This package is agnostic
to all methods. By default, `ctx.session.csrfToken` is used to retain the
token.

Here's an example that uses the default options.

```js
const Koa = require("koa");
const session = require("koa-session");
const crypto = require("crypto");
const csrf = require("koa-csrf-header");

const app = new Koa();

app.keys = [process.env.APP_KEY || crypto.randomBytes(256)];

app.use(session(app));

// Equivalent to app.use(csrf())
app.use(
  csrf({
    invalidTokenMessage: "Invalid CSRF Token",
    invalidTokenStatusCode: 403,
    excludedMethods: ["GET", "HEAD", "OPTIONS"],
    headerField: "X-CSRF-Token",
    getToken: ctx => ctx.session.csrfToken,
    setToken: (token, ctx) => {
      ctx.session.csrfToken = token;
    }
  })
);

app.use(ctx => {
  ctx.body = ctx.session.csrfToken;
});

app.listen(3000);
```

To show that there's multiple ways to store and send a CSRF Token, here's an
example that uses a simple cookie for delivery.

```js
const Koa = require("koa");
const csrf = require("koa-csrf-header");

const app = new Koa();

app.use(
  csrf({
    getToken: ctx => ctx.cookies.get("csrf-token"),
    setToken: (token, ctx) => {
      // We need httpOnly to be false so client-side JavaScript can read the
      // cookie and inject it into an AJAX request header later.
      ctx.cookies.set("csrf-token", token, { httpOnly: false });
    }
  })
);

app.use(ctx => {
  ctx.body = ctx.cookies.get("csrf-token");
});

app.listen(3000);
```

[#koa-csrf]: https://github.com/koajs/csrf
