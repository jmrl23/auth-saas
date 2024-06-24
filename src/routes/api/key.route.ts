import type { FromSchema } from 'json-schema-to-ts';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import {
  keyCreateSchema,
  keyDeleteSchema,
  keyListResponseSchema,
  keyListSchema,
  keyResponseSchema,
  keyStatusResponseSchema,
  keyStatusSchema,
  keyToggleSchema,
} from '../../schemas/api/key.schema';
import { errorResponseSchema } from '../../schemas/error.schema';

export const prefix = '/api/key';

export default asRoute(async function apiKeyRoute(app) {
  app
    .route({
      method: 'POST',
      url: '/create',
      schema: {
        description: 'Create key',
        tags: ['api', 'key', 'create'],
        body: keyCreateSchema,
        response: {
          200: keyResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const payload = request.body as FromSchema<typeof keyCreateSchema>;
        const key = await this.apiService.createKey(request.user!, payload);
        return {
          key,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/list',
      schema: {
        description: 'Get key list',
        tags: ['api', 'key', 'list', 'info'],
        querystring: keyListSchema,
        response: {
          200: keyListResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const payload = request.query as FromSchema<typeof keyListSchema>;
        const keys = await this.apiService.getKeyList(request.user!, payload);
        return {
          keys,
        };
      },
    })

    .route({
      method: 'GET',
      url: '',
      schema: {
        description: 'Get key status',
        tags: ['api', 'key', 'info'],
        querystring: keyStatusSchema,
        response: {
          200: keyStatusResponseSchema,
          default: errorResponseSchema,
        },
      },
      async handler(request) {
        const { key } = request.query as FromSchema<typeof keyStatusSchema>;
        const origin = request.headers.origin;
        const status = await this.apiService.getKeyStatus(origin, key);
        return {
          status,
        };
      },
    })

    .route({
      method: 'PATCH',
      url: '/update/enable',
      schema: {
        description: 'Toggle key',
        tags: ['api', 'key', 'update'],
        body: keyToggleSchema,
        response: {
          200: keyResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id, enable } = request.body as FromSchema<
          typeof keyToggleSchema
        >;
        const key = await this.apiService.toggleKeyById(
          request.user!,
          id,
          enable,
        );
        return {
          key,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/delete/:id',
      schema: {
        description: 'Delete key',
        tags: ['api', 'key', 'delete'],
        body: keyDeleteSchema,
        response: {
          200: keyResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.body as FromSchema<typeof keyDeleteSchema>;
        const key = await this.apiService.deleteKeyById(request.user!, id);
        return {
          key,
        };
      },
    });
});
