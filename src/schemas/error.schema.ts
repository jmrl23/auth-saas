import { asJsonSchema } from '../lib/util/typings';

export const errorResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Error',
  additionalProperties: false,
  required: ['statusCode', 'error', 'message'],
  properties: {
    statusCode: {
      type: 'number',
      examples: [500],
    },
    error: {
      type: 'string',
      examples: ['Internal Server Error'],
    },
    message: {
      type: 'string',
      examples: ['An error occurs'],
    },
  },
} as const);
