import { UserRole, type $Enums } from '@prisma/client';
import { asJsonSchema } from '../lib/util/typings';

export const userWithPasswordSchema = asJsonSchema({
  type: 'object',
  description: 'User schema',
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
          },
          primary: {
            type: 'boolean',
            default: false,
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
          examples: ['John Doe'],
        },
      },
    },
    password: {
      type: 'string',
      examples: ['password1'],
    },
    salt: {
      type: 'string',
      examples: ['some-random-string'],
    },
  },
} as const);

export const userWithoutPasswordSchema = asJsonSchema({
  type: 'object',
  description: 'User schema',
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
          examples: ['John Doe'],
        },
      },
    },
  },
} as const);

export const userResponseSchema = asJsonSchema({
  type: 'object',
  description: 'User return type schema',
  additionalProperties: false,
  required: ['user'],
  properties: {
    user: userWithoutPasswordSchema,
  },
} as const);

export const userRegisterSchema = asJsonSchema({
  type: 'object',
  description: 'User register schema',
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
