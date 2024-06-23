import { UserRole } from '@prisma/client';
import type { FromSchema } from 'json-schema-to-ts';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import {
  keyCreateSchema,
  keyResponseSchema,
} from '../../schemas/api/key.schema';
import { errorResponseSchema } from '../../schemas/error.schema';

export const prefix = '/api/key';

export default asRoute(async function apiKeyRoute(app) {
  app.route({
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
    preHandler: [userAuthorization(UserRole.ADMIN, UserRole.USER)],
    async handler(request) {
      const payload = request.body as FromSchema<typeof keyCreateSchema>;
      const key = await this.apiService.createKey(request.user!, payload);
      return {
        key,
      };
    },
  });
});
