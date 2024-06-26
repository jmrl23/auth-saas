import { asJsonSchema } from '../../lib/util/typings';

export const infoSchema = asJsonSchema({
  type: 'object',
  description: 'User information',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    displayName: {
      type: 'string',
      minLength: 1,
      examples: ['Johnny Doe'],
    },
  },
});

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
