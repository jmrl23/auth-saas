import { UserRole, type $Enums } from '@prisma/client';
import { asJsonSchema } from '../lib/util/typings';

export const userSchema = asJsonSchema({
  type: 'object',
  description: 'User without password',
  additionalProperties: false,
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'role',
    'username',
    'emails',
    'information',
  ],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
    role: {
      type: 'string',
      enum: Object.keys(UserRole) as unknown as $Enums.UserRole[],
    },
    username: {
      type: 'string',
      examples: ['user1'],
    },
    emails: {
      type: 'array',
      additionalItems: false,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'createdAt',
          'updatedAt',
          'userId',
          'email',
          'verified',
          'primary',
        ],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          email: {
            type: 'string',
            format: 'email',
            examples: ['user1@example.com'],
          },
          verified: {
            type: 'boolean',
            default: false,
            examples: [true],
          },
          primary: {
            type: 'boolean',
            default: false,
            examples: [true],
          },
        },
      },
    },
    information: {
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: {
        displayName: {
          type: 'string',
          nullable: true,
          examples: ['John Doe'],
        },
      },
    },
  },
} as const);

export const userRegisterSchema = asJsonSchema({
  type: 'object',
  description: 'User register',
  additionalProperties: false,
  required: ['username', 'password', 'email'],
  properties: {
    username: {
      type: 'string',
      minLength: 5,
      examples: ['user1'],
    },
    password: {
      type: 'string',
      format: 'password',
      minLength: 6,
      examples: ['password1'],
    },
    email: {
      type: 'string',
      format: 'email',
      examples: ['user1@example.com'],
    },
    role: {
      type: 'string',
      enum: Object.keys(UserRole) as unknown as $Enums.UserRole[],
      examples: [UserRole.USER],
    },
  },
} as const);

export const userLoginSchema = asJsonSchema({
  type: 'object',
  description: 'User login',
  additionalProperties: false,
  required: ['usernameOrEmail', 'password'],
  properties: {
    usernameOrEmail: {
      type: 'string',
      minLength: 1,
      examples: ['user1'],
    },
    password: {
      type: 'string',
      format: 'password',
      minLength: 1,
      examples: ['password1'],
    },
  },
} as const);

export const userPasswordUpdateSchema = asJsonSchema({
  type: 'object',
  description: 'Update user password',
  additionalProperties: false,
  required: ['password'],
  properties: {
    password: {
      type: 'string',
      format: 'password',
      minLength: 6,
      examples: ['password1'],
    },
  },
} as const);

export const userToggleSchema = asJsonSchema({
  type: 'object',
  description: 'Toggle user enable',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    enable: {
      type: 'boolean',
      examples: [true],
    },
  },
} as const);
