import vine from '@vinejs/vine'
import { USER_ROLES } from '#models/user'

/**
 * Fields shared by the create and update forms of the
 * user administration.
 */
const fullName = () => vine.string().trim().maxLength(255).nullable().optional()
const role = () => vine.enum(USER_ROLES)
const isActive = () => vine.boolean().optional()

/**
 * Validator used when an administrator creates a new user.
 */
export const createUserValidator = vine.create({
  fullName: fullName(),
  email: vine
    .string()
    .trim()
    .email()
    .maxLength(254)
    .unique({ table: 'users', column: 'email', caseInsensitive: true }),
  password: vine.string().minLength(8).maxLength(32).confirmed({ as: 'passwordConfirmation' }),
  role: role(),
  isActive: isActive(),
})

/**
 * Validator used when an administrator updates an existing user. The
 * edited user's id is passed as metadata, so its own e-mail does not
 * fail the unique check. Leaving the password empty keeps it unchanged.
 */
export const updateUserValidator = vine.withMetaData<{ userId: number }>().create({
  fullName: fullName(),
  email: vine
    .string()
    .trim()
    .email()
    .maxLength(254)
    .unique({
      table: 'users',
      column: 'email',
      caseInsensitive: true,
      filter: (db, _, field) => {
        db.whereNot('id', field.meta.userId)
      },
    }),
  password: vine
    .string()
    .minLength(8)
    .maxLength(32)
    .confirmed({ as: 'passwordConfirmation' })
    .optional(),
  role: role(),
  isActive: isActive(),
})

/**
 * Validator for the query string of the users listing.
 */
export const listUsersValidator = vine.create({
  search: vine.string().trim().maxLength(100).optional(),
  role: vine.enum(USER_ROLES).optional(),
  status: vine.enum(['active', 'inactive'] as const).optional(),
  page: vine.number().positive().withoutDecimals().optional(),
})
