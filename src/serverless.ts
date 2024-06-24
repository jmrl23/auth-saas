import fastify from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import logger from './lib/util/logger';
import setupPlugin from './plugins/setup.plugin';
import { NotFound } from 'http-errors';

const app = fastify();

app.register(
  fastifyPlugin(async function () {
    app.register(setupPlugin, { prefix: '/' });

    app.setNotFoundHandler(async function notFoundHandler(request) {
      throw new NotFound(`Cannot ${request.method} ${request.url}`);
    });

    app.setErrorHandler(async function errorHandler(error) {
      if (!error.statusCode || error.statusCode > 499) {
        logger.error(error.stack);
      }
      return error;
    });
  }),
);

export default async function (request: Request, response: Response) {
  await app.ready();
  app.server.emit('request', request, response);
}
