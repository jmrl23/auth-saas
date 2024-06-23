import { FromSchema } from 'json-schema-to-ts';
import { asRoute } from '../lib/util/typings';
import {
  userLoginSchema,
  userRegisterSchema,
  userResponseSchema,
  userTokenResponseSchema,
} from '../schemas/user.schema';
import { errorResponseSchema } from '../schemas/error.schema';
import userAuthorization from '../handlers/user-authorization';
import { UserRole } from '@prisma/client';

export const prefix = '/user';

export default asRoute(async function userRoute(app) {
  app
    .route({
      method: 'POST',
      url: '/register',
      schema: {
        security: [],
        tags: ['user'],
        body: userRegisterSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
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
    })

    .route({
      method: 'POST',
      url: '/login',
      schema: {
        security: [],
        tags: ['user'],
        body: userLoginSchema,
        response: {
          200: userTokenResponseSchema,
          default: errorResponseSchema,
        },
      },
      async handler(request) {
        const { usernameOrEmail, password } = request.body as FromSchema<
          typeof userLoginSchema
        >;
        const token = await this.userService.loginUser(
          usernameOrEmail,
          password,
        );
        return {
          token,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/session',
      preHandler: [userAuthorization(UserRole.ADMIN, UserRole.USER)],
      schema: {
        tags: ['user'],
        description: 'Get current session',
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      async handler(request) {
        const user = request.user ?? null;
        return {
          user,
        };
      },
    });
});
