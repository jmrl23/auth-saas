import { UserRole } from '@prisma/client';
import { Forbidden, NotFound } from 'http-errors';
import type { FromSchema } from 'json-schema-to-ts';
import ms from 'ms';
import userAuthorization from '../handlers/user-authorization';
import { asRoute } from '../lib/util/typings';
import {
  errorSchema,
  userSchema,
  userTokenSchema,
} from '../schemas/response.schema';
import {
  userLoginSchema,
  userRegisterSchema,
  userToggleSchema,
  userPasswordUpdateSchema,
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
        tags: ['user.default', 'create'],
        body: userRegisterSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('10m'),
        },
      },
      async handler(request) {
        const { username, password, email, role } = request.body as FromSchema<
          typeof userRegisterSchema
        >;
        if (request.user?.role !== UserRole.ADMIN && role === UserRole.ADMIN) {
          throw new Forbidden(
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
        tags: ['user.default', 'create'],
        body: userLoginSchema,
        response: {
          200: userTokenSchema,
          default: errorSchema,
        },
      },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
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
      schema: {
        description: 'Get current session',
        tags: ['user.default', 'read'],
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const user = request.user ?? null;
        return {
          user,
        };
      },
    })

    .route({
      method: 'PATCH',
      url: '/password/update',
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
        },
      },
      preHandler: [userAuthorization('ALL')],
      schema: {
        description: 'Update user password',
        tags: ['user.default', 'update'],
        body: userPasswordUpdateSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      async handler(request) {
        const { currentPassword, newPassword } = request.body as FromSchema<
          typeof userPasswordUpdateSchema
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
      url: '/toggle',
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: 'Enable/ disable user',
        tags: ['user.default', 'update'],
        body: userToggleSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { id, enable } = request.body as FromSchema<
          typeof userToggleSchema
        >;
        const user = await this.userService.getUserById(id);
        if (!user) throw new NotFound('User not found');
        const updatedUser = await this.userService.toggleUserEnable(
          user,
          enable,
        );
        return {
          user: updatedUser,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/logout',
      preHandler: [userAuthorization('ALL')],
      schema: {
        description: 'Logout',
        tags: ['user.default', 'delete'],
        response: {
          200: userSchema,
          default: errorSchema,
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
