import { FromSchema } from 'json-schema-to-ts';
import { asRoute } from '../lib/util/typings';
import { userRegisterSchema, userResponseSchema } from '../schemas/user.schema';

export const prefix = '/user';

export default asRoute(async function userRoute(app) {
  app.route({
    method: 'POST',
    url: '/register',
    schema: {
      tags: ['user'],
      body: userRegisterSchema,
      response: {
        '200': userResponseSchema,
      },
    },
    async handler(request) {
      const { username, password, email, role } = request.body as FromSchema<
        typeof userRegisterSchema
      >;
      const user = await this.userService.createUser(
        username,
        password,
        email,
        role,
      );
      return {
        user,
      };
    },
  });
});
