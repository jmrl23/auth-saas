import { asJsonSchema } from '../lib/util/typings';

export const apiAuthSchema = asJsonSchema({
  type: 'object',
  description: 'API key auth',
  additionalProperties: false,
  required: [],
  properties: {
    key: {
      type: 'string',
      minLength: 32,
      maxLength: 32,
    },
  },
} as const);
