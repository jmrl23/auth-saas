import fastifyPlugin from 'fastify-plugin';
import { NotFound } from 'http-errors';
import setupPlugin from './plugins/setup.plugin';

/**
 * Just a pluginized copy of [app](./app)
 */

export default fastifyPlugin(async function serverless(app) {
  app.register(setupPlugin, { prefix: '/' });

  app.setNotFoundHandler(async function notFoundHandler(request) {
    throw new NotFound(`Cannot ${request.method} ${request.url}`);
  });

  app.setErrorHandler(async function errorHandler(error) {
    if (!error.statusCode || error.statusCode > 499) {
      console.error(error.stack);
    }
    return error;
  });
});
