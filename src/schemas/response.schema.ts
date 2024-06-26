import { asJsonSchema } from '../lib/util/typings';
import { userSchema as user } from './user.schema';

export const errorSchema = asJsonSchema({
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

export const userSchema = asJsonSchema({
  type: 'object',
  description: 'User',
  additionalProperties: false,
  required: ['user'],
  properties: {
    user: { ...user, nullable: true },
  },
} as const);

export const userTokenSchema = asJsonSchema({
  type: 'object',
  description: 'User session token',
  additionalProperties: false,
  required: ['token'],
  properties: {
    token: {
      type: 'string',
      examples: ['<jwt>'],
    },
  },
} as const);
