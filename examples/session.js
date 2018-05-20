const Koa = require('koa')
const session = require('koa-session')
const crypto = require('crypto')
const csrf = require('../')

const app = new Koa()

app.keys = [(process.env.APP_KEY || crypto.randomBytes(256))]

app.use(session(app))

app.use(csrf({
  invalidTokenMessage: 'Invalid CSRF Token',
  invalidTokenStatusCode: 403,
  excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
  headerField: 'X-CSRF-Token',
  getToken: ctx => ctx.session.csrfToken,
  setToken: (token, ctx) => { ctx.session.csrfToken = token }
}))

app.use(ctx => {
  ctx.body = ctx.session.csrfToken
})

app.listen(3000)
