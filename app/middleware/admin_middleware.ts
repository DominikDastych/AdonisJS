import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Admin middleware denies access to users without the "admin" role.
 * It must run after the auth middleware, so the user is already
 * authenticated.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()

    if (!user.isAdmin) {
      ctx.session.flash('error', 'Do administrace mají přístup pouze administrátoři.')
      return ctx.response.redirect().toRoute('dashboard')
    }

    return next()
  }
}
