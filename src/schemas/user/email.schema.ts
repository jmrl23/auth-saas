import { asJsonSchema } from '../../lib/util/typings';

export const emailSendVerifyOtpSchema = asJsonSchema({
  type: 'object',
  description: 'Send email verification',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const);

export const emailVerifySchema = asJsonSchema({
  type: 'object',
  description: 'Verify user email',
  additionalProperties: false,
  required: ['email', 'otp'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    otp: {
      type: 'string',
      minLength: 6,
      maxLength: 6,
    },
  },
} as const);

export const emailSetPrimarySchema = asJsonSchema({
  type: 'object',
  description: "Set user's primary email",
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const);

export const emailCreateSchema = asJsonSchema({
  type: 'object',
  description: 'Create user email',
  additionalProperties: false,
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
  },
} as const);

export const emailDeleteSchema = asJsonSchema({
  type: 'object',
  description: 'Delete user email',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const);
