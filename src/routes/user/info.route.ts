import type { FromSchema } from 'json-schema-to-ts';
import ms from 'ms';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import { errorSchema, userSchema } from '../../schemas/response.schema';
import { infoUpdateSchema } from '../../schemas/user/info.schema';

export const prefix = '/user/info';

export default asRoute(async function userInfoRoute(app) {
  app.route({
    method: 'PATCH',
    url: '/update',
    config: {
      rateLimit: {
        max: 5,
        timeWindow: ms('5m'),
      },
    },
    schema: {
      description: 'Update user information',
      tags: ['user', 'update', 'user.info'],
      body: infoUpdateSchema,
      response: {
        200: userSchema,
        default: errorSchema,
      },
    },
    preHandler: [userAuthorization('ALL')],
    async handler(request) {
      const information = request.body as FromSchema<typeof infoUpdateSchema>;
      const user = await this.userService.updateUserInformation(
        request.user!,
        information,
      );
      return {
        user,
      };
    },
  });
});
