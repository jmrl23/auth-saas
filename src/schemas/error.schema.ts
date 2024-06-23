import { asJsonSchema } from '../lib/util/typings';

export const errorResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Error',
  additionalProperties: false,
  required: ['statusCode', 'error', 'message'],
  properties: {
    statusCode: {
      type: 'number',
      examples: [404],
    },
    error: {
      type: 'string',
      examples: ['Not found'],
    },
    message: {
      type: 'string',
      examples: ['Something not found'],
    },
  },
} as const);
