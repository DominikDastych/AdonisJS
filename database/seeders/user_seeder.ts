import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/**
 * Seeds a default administrator and a handful of regular users, so the
 * user administration has something to show right after installation.
 */
export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreateMany('email', [
      {
        fullName: 'Admin Administrátor',
        email: 'admin@example.com',
        password: 'admin1234',
        role: 'admin',
        isActive: true,
      },
      {
        fullName: 'Jan Novák',
        email: 'jan.novak@example.com',
        password: 'password123',
        role: 'user',
        isActive: true,
      },
      {
        fullName: 'Petra Svobodová',
        email: 'petra.svobodova@example.com',
        password: 'password123',
        role: 'user',
        isActive: true,
      },
      {
        fullName: 'Tomáš Dvořák',
        email: 'tomas.dvorak@example.com',
        password: 'password123',
        role: 'user',
        isActive: false,
      },
    ])
  }
}
