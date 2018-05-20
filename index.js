const Tokens = require('csrf')

module.exports = (opts = {}) => {
  // Options to match koa-csrf API
  const invalidTokenMessage = opts.invalidTokenMessage || 'Invalid CSRF Token'
  const invalidTokenStatusCode = opts.invalidTokenStatusCode || 403
  const excludedMethods = opts.excludedMethods || ['GET', 'HEAD', 'OPTIONS']

  // New options introduced in this package
  const headerField = opts.headerField || 'X-CSRF-Token'
  const getToken = opts.getToken || (ctx => ctx.session.csrfToken)
  const setToken = opts.setToken || ((token, ctx) => { ctx.session.csrfToken = token })

  return async function csrf (ctx, next) {
    let token = getToken(ctx)

    if (!token) {
      const tokens = new Tokens()
      const secret = await tokens.secret()
      token = tokens.create(secret)
      setToken(token, ctx)
    }

    // We're assuming that the user gets the CSRF token on an initial GET
    // request that isn't guarded. This should prevent a situation where we
    // immediately reject the first request of a user since it has no CSRF
    // token.
    if (excludedMethods.includes(ctx.method)) {
      return next()
    }

    if (ctx.request.get(headerField) !== token) {
      ctx.throw(invalidTokenStatusCode, invalidTokenMessage)
    }

    return next()
  }
}
