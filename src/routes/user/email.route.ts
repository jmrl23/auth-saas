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
import forbidMaster from '../../handlers/forbid-master';

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
      preHandler: [forbidMaster, userAuthorization('ALL')],
      async handler(request) {
        const { email } = request.body as FromSchema<typeof emailCreateSchema>;
        await this.userService.email.createEmail(request.user!, email);
        const user = await this.userService.getUserById(request.user!.id, {
          revalidate: true,
        });
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
      preHandler: [forbidMaster, userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.params as FromSchema<
          typeof emailSendVerifyOtpSchema
        >;
        await this.userService.email.sendVerificationOtp(request.user!, id);
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
          200: {
            type: 'boolean',
            additionalProperties: false,
            required: ['verified'],
            properties: {
              verified: {
                type: 'boolean',
                examples: [true],
              },
            },
          },
          default: errorSchema,
        },
      },
      async handler(request) {
        const { email, otp } = request.params as FromSchema<
          typeof emailVerifySchema
        >;
        await this.userService.email.verifyEmailOtp(email, otp);
        const verified = await this.userService.getUserByIdOrThrow(
          request.user?.id!,
          { revalidate: true },
        );
        return {
          verified,
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
      preHandler: [forbidMaster, userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.body as FromSchema<typeof emailSetPrimarySchema>;
        await this.userService.email.setPrimaryEmail(request.user!, id);
        const user = await this.userService.getUserByIdOrThrow(
          request.user!.id,
          { revalidate: true },
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
      preHandler: [forbidMaster, userAuthorization('ALL')],
      async handler(request) {
        const { id } = request.params as FromSchema<typeof emailDeleteSchema>;
        await this.userService.email.deleteEmail(request.user!, id);
        const user = await this.userService.getUserByIdOrThrow(
          request.user!.id,
          { revalidate: true },
        );
        return {
          user,
        };
      },
    });
});
