import { UserRole } from '@prisma/client';
import type { FromSchema } from 'json-schema-to-ts';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import {
  applicationCreateSchema,
  applicationDeleteSchema,
  applicationGetListSchema,
  applicationListResponseSchema,
  applicationResponseSchema,
  applicationUpdateOrigins,
} from '../../schemas/api/application.schema';
import { errorResponseSchema } from '../../schemas/error.schema';

export const prefix = '/api/application';

export default asRoute(async function apiAppRoute(app) {
  app

    .route({
      method: 'POST',
      url: '/create',
      schema: {
        description: 'Create application',
        tags: ['api', 'application', 'create'],
        body: applicationCreateSchema,
        response: {
          200: applicationResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { name, origins } = request.body as FromSchema<
          typeof applicationCreateSchema
        >;
        const application = await this.apiService.createApp(
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
        description: 'Get application list',
        tags: ['api', 'application', 'list', 'info'],
        querystring: applicationGetListSchema,
        response: {
          200: applicationListResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const payload = request.query as FromSchema<
          typeof applicationGetListSchema
        >;
        const applications = await this.apiService.getAppList(payload);
        return {
          applications,
        };
      },
    })

    .route({
      method: 'PATCH',
      url: '/update/origins',
      schema: {
        description: 'Update application origins',
        tags: ['api', 'application', 'update'],
        body: applicationUpdateOrigins,
        response: {
          200: applicationResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { id, origins } = request.body as FromSchema<
          typeof applicationUpdateOrigins
        >;
        const application = await this.apiService.updateAppOriginsById(
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
      url: '/delete/:id',
      schema: {
        description: 'Delete application',
        tags: ['api', 'application', 'delete'],
        params: applicationDeleteSchema,
        response: {
          200: applicationResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { id } = request.params as FromSchema<
          typeof applicationDeleteSchema
        >;
        const application = await this.apiService.deleteAppById(id);
        return {
          application,
        };
      },
    });
});
