import type { FromSchema } from 'json-schema-to-ts';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import {
  keyCreateSchema,
  keyDeleteSchema,
  keyListResponseSchema,
  keyListSchema,
  keyResponseSchema,
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
        tags: ['api', 'create'],
        body: keyCreateSchema,
        response: {
          200: keyResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const payload = request.body as FromSchema<typeof keyCreateSchema>;
        const key = await this.apiService.key.createKey(request.user!, payload);
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
        tags: ['api', 'read'],
        querystring: keyListSchema,
        response: {
          200: keyListResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const payload = request.query as FromSchema<typeof keyListSchema>;
        const keys = await this.apiService.key.getKeyList(
          request.user!,
          payload,
        );
        return {
          keys,
        };
      },
    })

    .route({
      method: 'PATCH',
      url: '/toggle',
      schema: {
        description: 'Toggle key',
        tags: ['api', 'update'],
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
        const key = await this.apiService.key.toggleKeyById(
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
      url: '/:id/delete',
      schema: {
        description: 'Delete key',
        tags: ['api', 'delete'],
        body: keyDeleteSchema,
        response: {
          200: keyResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.body as FromSchema<typeof keyDeleteSchema>;
        const key = await this.apiService.key.deleteKeyById(request.user!, id);
        return {
          key,
        };
      },
    });
});
