/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home').as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.on('/dashboard').render('pages/dashboard').as('dashboard')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

/**
 * User administration, available to administrators only
 */
router
  .group(() => {
    router.resource('users', controllers.admin.Users)
    router
      .post('users/:id/toggle-status', [controllers.admin.Users, 'toggleStatus'])
      .as('users.toggle_status')
  })
  .prefix('admin')
  .as('admin')
  .use([middleware.auth(), middleware.admin()])
