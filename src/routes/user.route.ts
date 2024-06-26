import { UserRole } from '@prisma/client';
import { Forbidden, NotFound } from 'http-errors';
import type { FromSchema } from 'json-schema-to-ts';
import ms from 'ms';
import userAuthorization from '../handlers/user-authorization';
import { asRoute } from '../lib/util/typings';
import { errorResponseSchema } from '../schemas/error.schema';
import {
  userCreateEmailSchema,
  userDeleteEmailSchema,
  userEmailUpdatePrimarySchema,
  userEnableToggleSchema,
  userLoginSchema,
  userRegisterSchema,
  userResponseSchema,
  userSendEmailVerificationSchema,
  userTokenResponseSchema,
  userUpdateInformationSchema,
  userUpdatePasswordSchema,
  userVerifyEmailSchema,
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
        tags: ['user', 'create'],
        body: userLoginSchema,
        response: {
          200: userTokenResponseSchema,
          default: errorResponseSchema,
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
      method: 'POST',
      url: '/email/create',
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: 'Create user email',
        tags: ['user', 'create'],
        body: userCreateEmailSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { email } = request.body as FromSchema<
          typeof userCreateEmailSchema
        >;
        const user = await this.userService.createUserEmail(
          request.user!,
          email,
        );
        return {
          user,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/session',
      schema: {
        description: 'Get current session',
        tags: ['user', 'read'],
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
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
      method: 'GET',
      url: '/email/:id/verify',
      config: {
        rateLimit: {
          max: 1,
          timeWindow: ms('30s'),
        },
      },
      schema: {
        description: 'Send email verification otp',
        tags: ['user', 'read'],
        params: userSendEmailVerificationSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.params as FromSchema<
          typeof userSendEmailVerificationSchema
        >;
        await this.userService.sendUserEmailVerification(request.user!, id);
        return {
          user: request.user,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/email/:email/:otp/verify',
      config: {
        rateLimit: {
          max: 1,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: 'Verify email',
        tags: ['user', 'read'],
        params: userVerifyEmailSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      async handler(request) {
        const { email, otp } = request.params as FromSchema<
          typeof userVerifyEmailSchema
        >;
        const user = await this.userService.verifyUserEmail(email, otp);
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
      url: '/information/update',
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: 'Update user information',
        tags: ['user', 'update'],
        body: userUpdateInformationSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
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
      method: 'PATCH',
      url: '/email/primary/set',
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: "Set user's primary email",
        tags: ['user', 'update'],
        body: userEmailUpdatePrimarySchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.body as FromSchema<
          typeof userEmailUpdatePrimarySchema
        >;
        const user = await this.userService.setUserPrimaryEmail(
          request.user!,
          id,
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
        tags: ['user', 'update'],
        body: userEnableToggleSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization(UserRole.ADMIN)],
      async handler(request) {
        const { id, enable } = request.body as FromSchema<
          typeof userEnableToggleSchema
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
      url: '/email/:id/delete',
      schema: {
        description: 'Delete user email',
        tags: ['user', 'delete'],
        params: userDeleteEmailSchema,
        response: {
          200: userResponseSchema,
          default: errorResponseSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.params as FromSchema<
          typeof userDeleteEmailSchema
        >;
        const user = await this.userService.deleteUserEmail(request.user!, id);
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
        tags: ['user', 'delete'],
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
