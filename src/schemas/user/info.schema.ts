import { asJsonSchema } from '../../lib/util/typings';

export const infoUpdateSchema = asJsonSchema({
  type: 'object',
  description: 'Update user information',
  additionalProperties: false,
  required: [],
  properties: {
    displayName: {
      type: 'string',
      minLength: 1,
      examples: ['Johnny Doe'],
    },
  },
} as const);
