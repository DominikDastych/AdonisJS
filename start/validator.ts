/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Czech validation messages and field names used by all validators.
 */
vine.messagesProvider = new SimpleMessagesProvider(
  {
    'required': 'Pole {{ field }} je povinné.',
    'string': 'Pole {{ field }} musí být text.',
    'email': 'Zadejte platnou e-mailovou adresu.',
    'minLength': 'Pole {{ field }} musí mít alespoň {{ min }} znaků.',
    'maxLength': 'Pole {{ field }} může mít nejvýše {{ max }} znaků.',
    'enum': 'Vyberte platnou hodnotu pole {{ field }}.',
    'boolean': 'Pole {{ field }} musí být ano/ne.',
    'confirmed': 'Hesla se neshodují.',
    'sameAs': 'Hesla se neshodují.',
    'database.unique': 'Tento e-mail už je použitý.',
  },
  {
    fullName: 'celé jméno',
    email: 'e-mail',
    password: 'heslo',
    passwordConfirmation: 'potvrzení hesla',
    role: 'role',
    isActive: 'stav účtu',
  }
)
