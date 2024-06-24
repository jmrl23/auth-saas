import { asJsonSchema } from '../../lib/util/typings';

export const keySchema = asJsonSchema({
  type: 'object',
  description: 'Key',
  additionalProperties: false,
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'userId',
    'apiKey',
    'expires',
    'enable',
    'apps',
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
    apiKey: {
      type: 'string',
    },
    expires: {
      type: 'string',
      format: 'date-time',
      nullable: true,
    },
    enable: {
      type: 'boolean',
      examples: [true],
    },
    apps: {
      type: 'array',
      additionalItems: false,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
            examples: ['file'],
          },
        },
      },
    },
  },
} as const);

export const keyCreateSchema = asJsonSchema({
  type: 'object',
  description: 'Create key',
  additionalProperties: false,
  required: ['apps'],
  properties: {
    expiresDays: {
      type: 'integer',
      minimum: 1,
    },
    apps: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid',
      },
    },
  },
} as const);

export const keyListSchema = asJsonSchema({
  type: 'object',
  description: 'Get key list',
  additionalProperties: false,
  required: [],
  properties: {
    revalidate: {
      type: 'boolean',
      examples: [false],
    },
    createdAtFrom: {
      type: 'string',
      format: 'date',
      examples: ['2001-01-01'],
    },
    createdAtTo: {
      type: 'string',
      format: 'date',
    },
    updatedAtFrom: {
      type: 'string',
      format: 'date',
    },
    updatedAtTo: {
      type: 'string',
      format: 'date',
    },
    skip: {
      type: 'integer',
      minimum: 0,
    },
    take: {
      type: 'integer',
      minimum: 0,
    },
    order: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'asc',
      examples: ['asc'],
    },
    expired: {
      type: 'boolean',
      examples: [false],
    },
    enable: {
      type: 'boolean',
      examples: [true],
    },
    apps: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid',
      },
    },
  },
} as const);

export const keyToggleSchema = asJsonSchema({
  type: 'object',
  description: 'Toggle key',
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

export const keyDeleteSchema = asJsonSchema({
  type: 'object',
  description: 'Delete key',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const);

export const keyStatusSchema = asJsonSchema({
  type: 'object',
  description: 'Get key status',
  additionalProperties: false,
  required: [],
  properties: {
    key: {
      type: 'string',
      minLength: 32,
    },
  },
} as const);

export const keyResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Key response',
  additionalProperties: false,
  required: ['key'],
  properties: {
    key: { ...keySchema, nullable: true },
  },
} as const);

export const keyListResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Key list response',
  additionalProperties: false,
  required: ['keys'],
  properties: {
    keys: {
      type: 'array',
      items: keySchema,
    },
  },
} as const);

export const keyStatusResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Get key status',
  additionalProperties: false,
  required: ['status'],
  properties: {
    status: {
      type: 'object',
      additionalProperties: false,
      required: ['active'],
      properties: {
        active: {
          type: 'boolean',
          examples: [false],
        },
        message: {
          type: 'string',
          examples: ['API key expired'],
        },
      },
    },
  },
} as const);
