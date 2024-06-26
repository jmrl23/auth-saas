import { asJsonSchema } from '../../lib/util/typings';

export const appSchema = asJsonSchema({
  type: 'object',
  description: 'Application',
  additionalProperties: false,
  required: ['id', 'createdAt', 'updatedAt', 'authorId', 'name', 'origins'],
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
    authorId: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
      examples: ['file'],
    },
    origins: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri',
        examples: ['https://example.com'],
      },
    },
  },
} as const);

export const appCreateSchema = asJsonSchema({
  type: 'object',
  description: 'Create application',
  additionalProperties: false,
  required: ['name', 'origins'],
  properties: {
    name: {
      type: 'string',
      examples: ['file'],
      minLength: 1,
    },
    origins: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri',
        examples: ['https://app.example.com'],
      },
    },
  },
} as const);

export const appGetListSchema = asJsonSchema({
  type: 'object',
  description: 'Get application list',
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
    name: {
      type: 'string',
      minLength: 1,
      examples: ['file'],
    },
    authorId: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const);

export const appSetOriginsSchema = asJsonSchema({
  type: 'object',
  description: 'Set application origins',
  additionalProperties: false,
  required: ['id', 'origins'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    origins: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri',
      },
    },
  },
} as const);

export const appDeleteSchema = asJsonSchema({
  type: 'object',
  description: 'Delete application',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const);

export const appResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Application response',
  additionalProperties: false,
  required: ['application'],
  properties: {
    application: { ...appSchema, nullable: true },
  },
} as const);

export const appListResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Application list response',
  additionalProperties: false,
  required: ['applications'],
  properties: {
    applications: {
      type: 'array',
      items: appSchema,
    },
  },
} as const);
