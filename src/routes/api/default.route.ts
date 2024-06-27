import type { FromSchema } from 'json-schema-to-ts';
import { asRoute } from '../../lib/util/typings';
import { apiAuthSchema } from '../../schemas/api.schema';
import { errorSchema } from '../../schemas/response.schema';

export default asRoute(async function apiRoute(app) {
  app.route({
    method: 'GET',
    url: '',
    schema: {
      description: apiAuthSchema.description,
      tags: ['default.api', 'read'],
      querystring: apiAuthSchema,
      responses: {
        default: errorSchema,
      },
    },
    async handler(request, reply) {
      const { key } = request.query as FromSchema<typeof apiAuthSchema>;
      await this.apiService.validateRequest(key, request.headers.origin);
      reply.status(200);
    },
  });
});
