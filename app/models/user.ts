import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

export const USER_ROLES = ['admin', 'user'] as const
export type UserRole = (typeof USER_ROLES)[number]

/**
 * User model represents a user in the application.
 * It extends UserSchema and includes authentication capabilities
 * through the withAuthFinder mixin.
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /**
   * The generated schema types "role" as a plain string, narrow it
   * to the roles the application knows about.
   */
  @column()
  declare role: UserRole

  /**
   * SQLite stores booleans as 0/1 integers, cast them back.
   */
  @column({ consume: (value) => Boolean(value) })
  declare isActive: boolean

  get isAdmin() {
    return this.role === 'admin'
  }

  /**
   * Get the user's initials from their full name or email.
   * Returns the first letter of first and last name if available,
   * otherwise returns the first two characters of the email username.
   */
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
