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
import { errorResponseSchema } from '../../schemas/error.schema';

export const prefix = '/api/app';

export default asRoute(async function apiAppRoute(app) {
  app

    .route({
      method: 'POST',
      url: '/create',
      schema: {
        description: appCreateSchema.description,
        tags: ['api', 'create'],
        body: appCreateSchema,
        response: {
          200: appResponseSchema,
          default: errorResponseSchema,
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
        tags: ['api', 'read'],
        querystring: appGetListSchema,
        response: {
          200: appListResponseSchema,
          default: errorResponseSchema,
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
        tags: ['api', 'update'],
        body: appSetOriginsSchema,
        response: {
          200: appResponseSchema,
          default: errorResponseSchema,
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
        tags: ['api', 'delete'],
        params: appDeleteSchema,
        response: {
          200: appResponseSchema,
          default: errorResponseSchema,
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
