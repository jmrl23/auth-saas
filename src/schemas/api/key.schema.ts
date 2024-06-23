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

export const keyResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Key response',
  additionalProperties: false,
  required: ['key'],
  properties: {
    key: { ...keySchema, nullable: true },
  },
} as const);
