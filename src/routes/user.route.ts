import { UserRole } from '@prisma/client';
import { Unauthorized } from 'http-errors';
import type { FromSchema } from 'json-schema-to-ts';
import userAuthorization from '../handlers/user-authorization';
import { asRoute } from '../lib/util/typings';
import { errorResponseSchema } from '../schemas/error.schema';
import {
  userLoginSchema,
  userRegisterSchema,
  userResponseSchema,
  userTokenResponseSchema,
  userUpdateInformationSchema,
  userUpdatePasswordSchema,
} from '../schemas/user.schema';

export const prefix = '/user';

export default asRoute(async function userRoute(app) {
  app
    .route({
      method: 'POST',
      url: '/create',
      schema: {
        description: 'Register user',
        security: [],
        tags: ['user', 'create'],
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
        if (request.user?.role !== UserRole.ADMIN && role === UserRole.ADMIN) {
          throw new Unauthorized(
            `Not authorized to create an ${UserRole.ADMIN} account`,
          );
        }
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
        description: 'Login user',
        security: [],
        tags: ['user', 'auth'],
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
      preHandler: [userAuthorization('ALL')],
      schema: {
        description: 'Get current session',
        tags: ['user', 'info'],
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
    })

    .route({
      method: 'PATCH',
      url: '/update/password',
      preHandler: [userAuthorization('ALL')],
      schema: {
        description: 'Update user password',
        tags: ['user', 'update'],
        body: userUpdatePasswordSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      async handler(request) {
        const { currentPassword, newPassword } = request.body as FromSchema<
          typeof userUpdatePasswordSchema
        >;
        const user = await this.userService.updateUserPassword(
          request.user!,
          currentPassword,
          newPassword,
        );
        return {
          user,
        };
      },
    })

    .route({
      method: 'PATCH',
      url: '/update/information',
      preHandler: [userAuthorization('ALL')],
      schema: {
        description: 'Update user information',
        tags: ['user', 'update'],
        body: userUpdateInformationSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      async handler(request) {
        const information = request.body as FromSchema<
          typeof userUpdateInformationSchema
        >;
        const user = await this.userService.updateUserInformation(
          request.user!,
          information,
        );
        return {
          user,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/logout',
      preHandler: [userAuthorization('ALL')],
      schema: {
        tags: ['user', 'delete'],
        description: 'Logout',
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      async handler(request) {
        const [, token] = request.headers.authorization?.split(' ') ?? [];
        const user = await this.userService.logoutByToken(token);
        return {
          user,
        };
      },
    });
});
