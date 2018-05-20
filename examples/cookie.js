const Koa = require('koa')
const csrf = require('../')

const app = new Koa()

app.use(csrf({
  getToken: ctx => ctx.cookies.get('csrf-token'),
  setToken: (token, ctx) => {
    // We need httpOnly to be false so client-side JavaScript can read the
    // cookie and inject it into an AJAX request header later.
    ctx.cookies.set('csrf-token', token, { httpOnly: false })
  }
}))

app.use(ctx => {
  ctx.body = ctx.cookies.get('csrf-token')
})

app.listen(3000)
