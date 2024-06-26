import type { FromSchema } from 'json-schema-to-ts';
import ms from 'ms';
import userAuthorization from '../../handlers/user-authorization';
import { asRoute } from '../../lib/util/typings';
import { errorSchema, userSchema } from '../../schemas/response.schema';
import {
  emailCreateSchema,
  emailDeleteSchema,
  emailSendVerifyOtpSchema,
  emailSetPrimarySchema,
  emailVerifySchema,
} from '../../schemas/user/email.schema';

export const prefix = '/user/email';

export default asRoute(async function userEmailRoute(app) {
  app
    .route({
      method: 'POST',
      url: '/create',
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: 'Create user email',
        tags: ['user.email', 'create'],
        body: emailCreateSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { email } = request.body as FromSchema<typeof emailCreateSchema>;
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
      url: '/:id/verify',
      config: {
        rateLimit: {
          max: 1,
          timeWindow: ms('30s'),
        },
      },
      schema: {
        description: 'Send email verification otp',
        tags: ['user.email', 'read'],
        params: emailSendVerifyOtpSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.params as FromSchema<
          typeof emailSendVerifyOtpSchema
        >;
        await this.userService.sendUserEmailVerification(request.user!, id);
        return {
          user: request.user,
        };
      },
    })
    .route({
      method: 'GET',
      url: '/:email/:otp/verify',
      config: {
        rateLimit: {
          max: 1,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: 'Verify email',
        tags: ['user.email', 'read'],
        params: emailVerifySchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      async handler(request) {
        const { email, otp } = request.params as FromSchema<
          typeof emailVerifySchema
        >;
        const user = await this.userService.verifyUserEmail(email, otp);
        return {
          user,
        };
      },
    })
    .route({
      method: 'PATCH',
      url: '/primary/set',
      config: {
        rateLimit: {
          max: 5,
          timeWindow: ms('5m'),
        },
      },
      schema: {
        description: "Set user's primary email",
        tags: ['user.email', 'update'],
        body: emailSetPrimarySchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.body as FromSchema<typeof emailSetPrimarySchema>;
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
      method: 'DELETE',
      url: '/:id/delete',
      schema: {
        description: 'Delete user email',
        tags: ['user.email', 'delete'],
        params: emailDeleteSchema,
        response: {
          200: userSchema,
          default: errorSchema,
        },
      },
      preHandler: [userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.params as FromSchema<typeof emailDeleteSchema>;
        const user = await this.userService.deleteUserEmail(request.user!, id);
        return {
          user,
        };
      },
    });
});
