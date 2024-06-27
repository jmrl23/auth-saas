import { UserRole } from '@prisma/client';
import { Forbidden } from 'http-errors';
import type { FromSchema } from 'json-schema-to-ts';
import ms from 'ms';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import {
  errorSchema,
  userSchema,
  userTokenSchema,
} from '../../schemas/response.schema';
import {
  userLoginSchema,
  userRegisterSchema,
  userToggleSchema,
  userPasswordUpdateSchema,
} from '../../schemas/user.schema';
import forbidMaster from '../../handlers/forbid-master';

export default asRoute(async function userRoute(app) {
  app

    .route({
      method: 'POST',
      url: '/create',
      schema: {
        description: 'Register user',
        security: [],
        tags: ['default.user', 'create'],
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
        tags: ['default.user', 'create'],
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
        tags: ['default.user', 'read'],
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
      preHandler: [forbidMaster, userAuthorization('ALL')],
      schema: {
        description: 'Update user password',
        tags: ['default.user', 'update'],
        body: userPasswordUpdateSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      async handler(request) {
        const { password } = request.body as FromSchema<
          typeof userPasswordUpdateSchema
        >;
        const user = await this.userService.updateUser(request.user!, {
          password,
        });
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
        tags: ['default.user', 'update'],
        body: userToggleSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      preHandler: [forbidMaster, userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { id, enable } = request.body as FromSchema<
          typeof userToggleSchema
        >;
        const ref = await this.userService.getUserByIdOrThrow(id);
        const user = await this.userService.updateUser(ref, {
          enable: enable === undefined ? !ref.enable : enable,
        });
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
        description: 'Logout',
        tags: ['default.user', 'delete'],
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      async handler(request) {
        const [, token] = request.headers.authorization?.split(' ') ?? [];
        const user = request.user;
        await this.userService.session.deleteSession(token);
        return {
          user,
        };
      },
    });
});
