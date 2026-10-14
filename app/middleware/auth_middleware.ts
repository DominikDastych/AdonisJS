import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    /**
     * Users deactivated by an administrator lose access immediately,
     * even when they still hold a valid session.
     */
    if (!ctx.auth.user!.isActive) {
      await ctx.auth.use('web').logout()
      ctx.session.flash('error', 'Váš účet byl deaktivován.')
      return ctx.response.redirect(this.redirectTo)
    }

    return next()
  }
}
