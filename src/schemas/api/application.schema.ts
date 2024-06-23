import { asJsonSchema } from '../../lib/util/typings';

export const applicationSchema = asJsonSchema({
  type: 'object',
  description: 'Application',
  additionalProperties: false,
  required: ['id', 'createdAt', 'updatedAt', 'authorId', 'name'],
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
  },
} as const);

export const applicationCreateSchema = asJsonSchema({
  type: 'object',
  description: 'Create application',
  additionalProperties: false,
  required: ['name'],
  properties: {
    name: {
      type: 'string',
      examples: ['file'],
      minLength: 1,
    },
  },
} as const);

export const applicationGetListSchema = asJsonSchema({
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
    name: {
      type: 'string',
      minLength: 1,
      examples: ['file'],
    },
    authorId: {
      type: 'string',
      format: 'uuid',
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
  },
} as const);

export const applicationDeleteSchema = asJsonSchema({
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

export const applicationResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Application response',
  additionalProperties: false,
  required: ['application'],
  properties: {
    application: { ...applicationSchema, nullable: true },
  },
} as const);

export const applicationListResponseSchema = asJsonSchema({
  type: 'object',
  description: 'Application list response',
  additionalProperties: false,
  required: ['applications'],
  properties: {
    applications: {
      type: 'array',
      items: applicationSchema,
    },
  },
} as const);
