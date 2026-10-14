import User from '#models/user'
import { loginValidator } from '#validators/user'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * SessionController handles user authentication and session management.
 * It provides methods for displaying the login page, authenticating users,
 * and logging out.
 */
export default class SessionController {
  /**
   * Display the login page
   */
  async create({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * Authenticate user credentials and create a new session
   */
  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    if (!user.isActive) {
      session.flash('error', 'Váš účet byl deaktivován. Kontaktujte administrátora.')
      return response.redirect().back()
    }

    user.lastLoginAt = DateTime.now()
    await user.save()

    await auth.use('web').login(user)
    response.redirect().toRoute('dashboard')
  }

  /**
   * Log out the current user and destroy their session
   */
  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    response.redirect().toRoute('session.create')
  }
}
