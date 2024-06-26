import masterOnly from '../handlers/master-only';
import { asRoute } from '../lib/util/typings';
import { errorResponseSchema } from '../schemas/error.schema';

export const prefix = '/master';

export default asRoute(async function masterRoute(app) {
  app.addHook('preHandler', masterOnly);

  // app.route({
  //   method: 'GET',
  //   url: '',
  //   schema: {
  //     description: 'Greeting',
  //     tags: ['master'],
  //     response: {
  //       default: errorResponseSchema,
  //       200: {
  //         description: 'Greeting',
  //         type: 'object',
  //         additionalProperties: false,
  //         required: ['message'],
  //         properties: {
  //           message: {
  //             type: 'string',
  //             examples: ['Hello, Master!'],
  //           },
  //         },
  //       },
  //     },
  //   },
  //   async handler() {
  //     return {
  //       message: 'Hello, Master!',
  //     };
  //   },
  // });
});
