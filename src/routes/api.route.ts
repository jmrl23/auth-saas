import type { FromSchema } from 'json-schema-to-ts';
import { asRoute } from '../lib/util/typings';
import { apiAuthSchema } from '../schemas/api.schema';
import { errorResponseSchema } from '../schemas/error.schema';

export const prefix = '/api';

export default asRoute(async function apiRoute(app) {
  app.route({
    method: 'GET',
    url: '',
    schema: {
      description: apiAuthSchema.description,
      tags: ['api', 'read'],
      querystring: apiAuthSchema,
      responses: {
        default: errorResponseSchema,
      },
    },
    async handler(request, reply) {
      const { key } = request.query as FromSchema<typeof apiAuthSchema>;
      await this.apiService.validateRequest(key, request.headers.origin);
      reply.status(200);
    },
  });
});
