import { UserRole } from '@prisma/client';
import type { FromSchema } from 'json-schema-to-ts';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import {
  appCreateSchema,
  appDeleteSchema,
  appGetListSchema,
  appListResponseSchema,
  appResponseSchema,
  appSetOriginsSchema,
} from '../../schemas/api/app.schema';
import { errorSchema } from '../../schemas/response.schema';

export const prefix = '/api/app';

export default asRoute(async function apiAppRoute(app) {
  app

    .route({
      method: 'POST',
      url: '/create',
      schema: {
        description: appCreateSchema.description,
        tags: ['api.app', 'create'],
        body: appCreateSchema,
        response: {
          200: appResponseSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { name, origins } = request.body as FromSchema<
          typeof appCreateSchema
        >;
        const application = await this.apiService.app.createApp(
          request.user!,
          name,
          origins,
        );
        return {
          application,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/list',
      schema: {
        description: appGetListSchema.description,
        tags: ['api.app', 'read'],
        querystring: appGetListSchema,
        response: {
          200: appListResponseSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const payload = request.query as FromSchema<typeof appGetListSchema>;
        const applications = await this.apiService.app.getAppList(payload);
        return {
          applications,
        };
      },
    })

    .route({
      method: 'PATCH',
      url: '/origins/set',
      schema: {
        description: appSetOriginsSchema.description,
        tags: ['api.app', 'update'],
        body: appSetOriginsSchema,
        response: {
          200: appResponseSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { id, origins } = request.body as FromSchema<
          typeof appSetOriginsSchema
        >;
        const application = await this.apiService.app.setAppOriginsById(
          id,
          origins,
        );
        return {
          application,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/:id/delete',
      schema: {
        description: appDeleteSchema.description,
        tags: ['api.app', 'delete'],
        params: appDeleteSchema,
        response: {
          200: appResponseSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { id } = request.params as FromSchema<typeof appDeleteSchema>;
        const application = await this.apiService.app.deleteAppById(id);
        return {
          application,
        };
      },
    });
});
