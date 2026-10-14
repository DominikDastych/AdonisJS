import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

async function createAdmin() {
  return User.create({
    fullName: 'Admin Test',
    email: 'admin@test.cz',
    password: 'admin1234',
    role: 'admin',
    isActive: true,
  })
}

async function createUser(overrides: Partial<User> = {}) {
  return User.create({
    fullName: 'Jan Test',
    email: 'jan@test.cz',
    password: 'password123',
    role: 'user',
    isActive: true,
    ...overrides,
  })
}

test.group('Admin / users access', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('guest is redirected to the login page', async ({ client }) => {
    const response = await client.get('/admin/users').redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('regular user cannot access the administration', async ({ client }) => {
    const user = await createUser()
    const response = await client.get('/admin/users').loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard')
  })

  test('admin sees the list of users', async ({ client }) => {
    const admin = await createAdmin()
    await createUser()

    const response = await client.get('/admin/users').loginAs(admin)
    response.assertStatus(200)
    response.assertTextIncludes('jan@test.cz')
    response.assertTextIncludes('admin@test.cz')
  })

  test('admin can search users', async ({ client, assert }) => {
    const admin = await createAdmin()
    await createUser()
    await createUser({ email: 'petra@test.cz', fullName: 'Petra Test' })

    const response = await client.get('/admin/users').qs({ search: 'petra' }).loginAs(admin)
    response.assertTextIncludes('petra@test.cz')
    assert.notInclude(response.text(), 'jan@test.cz')
  })
})

test.group('Admin / users management', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin creates a user', async ({ client, assert }) => {
    const admin = await createAdmin()

    const response = await client
      .post('/admin/users')
      .form({
        fullName: 'Nový Uživatel',
        email: 'novy@test.cz',
        password: 'password123',
        passwordConfirmation: 'password123',
        role: 'user',
        isActive: 'true',
      })
      .withCsrfToken()
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/users')

    const user = await User.findByOrFail('email', 'novy@test.cz')
    assert.equal(user.role, 'user')
    assert.isTrue(user.isActive)
    assert.isTrue(await hash.verify(user.password, 'password123'))
  })

  test('creating a user with a taken e-mail fails validation', async ({ client, assert }) => {
    const admin = await createAdmin()
    await createUser()

    const response = await client
      .post('/admin/users')
      .form({
        email: 'jan@test.cz',
        password: 'password123',
        passwordConfirmation: 'password123',
        role: 'user',
      })
      .withCsrfToken()
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('inputErrorsBag', { email: ['Tento e-mail už je použitý.'] })
    assert.lengthOf(await User.query().where('email', 'jan@test.cz'), 1)
  })

  test('admin updates a user and keeps the password when left empty', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const user = await createUser()
    const passwordHash = user.password

    const response = await client
      .put(`/admin/users/${user.id}`)
      .form({ fullName: 'Jan Upravený', email: 'jan@test.cz', role: 'admin', isActive: 'true' })
      .withCsrfToken()
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(302)
    await user.refresh()
    assert.equal(user.fullName, 'Jan Upravený')
    assert.equal(user.role, 'admin')
    assert.equal(user.password, passwordHash)
  })

  test('admin cannot remove their own admin role', async ({ client, assert }) => {
    const admin = await createAdmin()

    await client
      .put(`/admin/users/${admin.id}`)
      .form({ email: admin.email, role: 'user', isActive: 'true' })
      .withCsrfToken()
      .loginAs(admin)
      .redirects(0)

    await admin.refresh()
    assert.equal(admin.role, 'admin')
  })

  test('admin toggles the account status', async ({ client, assert }) => {
    const admin = await createAdmin()
    const user = await createUser()

    await client
      .post(`/admin/users/${user.id}/toggle-status`)
      .withCsrfToken()
      .loginAs(admin)
      .redirects(0)

    await user.refresh()
    assert.isFalse(user.isActive)
  })

  test('admin deletes a user but not themselves', async ({ client, assert }) => {
    const admin = await createAdmin()
    const user = await createUser()

    await client.delete(`/admin/users/${user.id}`).withCsrfToken().loginAs(admin).redirects(0)
    await client.delete(`/admin/users/${admin.id}`).withCsrfToken().loginAs(admin).redirects(0)

    assert.isNull(await User.find(user.id))
    assert.isNotNull(await User.find(admin.id))
  })
})

test.group('Deactivated users', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cannot log in', async ({ client }) => {
    await createUser({ isActive: false })

    const response = await client
      .post('/login')
      .form({ email: 'jan@test.cz', password: 'password123' })
      .withCsrfToken()
      .redirects(0)

    response.assertSessionMissing('auth_web')
    response.assertFlashMessage('error', 'Váš účet byl deaktivován. Kontaktujte administrátora.')
  })

  test('lose access with an existing session', async ({ client }) => {
    const user = await createUser({ isActive: false })

    const response = await client.get('/dashboard').loginAs(user).redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})
