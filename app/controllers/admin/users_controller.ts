import User, { USER_ROLES } from '#models/user'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import {
  createUserValidator,
  listUsersValidator,
  updateUserValidator,
} from '#validators/admin_user'

const PER_PAGE = 10

/**
 * UsersController implements the user administration: listing with
 * search, filters and pagination, plus creating, editing, (de)activating
 * and deleting users. All actions are restricted to administrators by
 * the "admin" middleware.
 */
export default class UsersController {
  /**
   * Paginated list of users, filterable by a search term, role and status
   */
  async index({ request, view }: HttpContext) {
    const filters = await listUsersValidator.validate(request.qs())

    const users = await User.query()
      .if(filters.search, (query) => {
        const term = `%${filters.search!.toLowerCase()}%`
        query.where((group) => {
          group
            .whereRaw('lower(email) like ?', [term])
            .orWhereRaw('lower(full_name) like ?', [term])
        })
      })
      .if(filters.role, (query) => query.where('role', filters.role!))
      .if(filters.status, (query) => query.where('is_active', filters.status === 'active'))
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(filters.page ?? 1, PER_PAGE)

    users.baseUrl(request.url()).queryString({
      search: filters.search,
      role: filters.role,
      status: filters.status,
    })

    const [stats] = await db
      .from('users')
      .select(
        db.raw('count(*) as total'),
        db.raw("coalesce(sum(role = 'admin'), 0) as admins"),
        db.raw('coalesce(sum(is_active), 0) as active')
      )

    return view.render('pages/admin/users/index', {
      users,
      filters,
      roles: USER_ROLES,
      stats,
    })
  }

  /**
   * Detail of a single user
   */
  async show({ params, view }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return view.render('pages/admin/users/show', { user })
  }

  /**
   * Form for creating a new user
   */
  async create({ view }: HttpContext) {
    return view.render('pages/admin/users/create', { roles: USER_ROLES })
  }

  /**
   * Persist a new user
   */
  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)

    const user = await User.create({
      fullName: payload.fullName ?? null,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      isActive: payload.isActive ?? false,
    })

    session.flash('success', `Uživatel ${user.email} byl vytvořen.`)
    return response.redirect().toRoute('admin.users.index')
  }

  /**
   * Form for editing an existing user
   */
  async edit({ params, view }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return view.render('pages/admin/users/edit', { user, roles: USER_ROLES })
  }

  /**
   * Update an existing user. The password is changed only when a new
   * one is provided. Administrators cannot remove their own admin role
   * or deactivate themselves, so they can never lock themselves out.
   */
  async update({ params, request, response, session, auth }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const payload = await request.validateUsing(updateUserValidator, {
      meta: { userId: user.id },
    })
    const isActive = payload.isActive ?? false

    if (user.id === auth.user!.id && (payload.role !== 'admin' || !isActive)) {
      session.flash('error', 'Nemůžete odebrat roli administrátora ani deaktivovat sami sebe.')
      return response.redirect().back()
    }

    user.merge({
      fullName: payload.fullName ?? null,
      email: payload.email,
      role: payload.role,
      isActive,
    })
    if (payload.password) {
      user.password = payload.password
    }
    await user.save()

    session.flash('success', `Uživatel ${user.email} byl upraven.`)
    return response.redirect().withQs(false).toRoute('admin.users.index')
  }

  /**
   * Flip the active flag of a user
   */
  async toggleStatus({ params, response, session, auth }: HttpContext) {
    const user = await User.findOrFail(params.id)

    if (user.id === auth.user!.id) {
      session.flash('error', 'Nemůžete deaktivovat sami sebe.')
      return response.redirect().back()
    }

    user.isActive = !user.isActive
    await user.save()

    session.flash(
      'success',
      `Uživatel ${user.email} byl ${user.isActive ? 'aktivován' : 'deaktivován'}.`
    )
    return response.redirect().back()
  }

  /**
   * Delete a user. Like update, it is reached through method spoofing,
   * so the "_method" query string is not forwarded to the redirect.
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    const user = await User.findOrFail(params.id)

    if (user.id === auth.user!.id) {
      session.flash('error', 'Nemůžete smazat svůj vlastní účet.')
      return response.redirect().back()
    }

    await user.delete()

    session.flash('success', `Uživatel ${user.email} byl smazán.`)
    return response.redirect().withQs(false).toRoute('admin.users.index')
  }
}
