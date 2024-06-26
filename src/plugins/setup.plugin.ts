import * as colorette from 'colorette';
import path from 'node:path';
import fastifyPlugin from 'fastify-plugin';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import logger from '../lib/util/logger';
import swaggerPlugin from './swagger.plugin';
import routesPlugin from './routes.plugin';
import middlewaresPlugin from './middlewares.plugin';
import servicesPlugin from './services.plugin';
import userPlugin from './user.plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import ms from 'ms';

export default fastifyPlugin(
  async function setupPlugin(app) {
    await app.register(fastifyRateLimit, {
      timeWindow: ms('1m'),
      max: 300,
    });

    await app.register(servicesPlugin, {
      prefix: '/',
    });

    await app.register(userPlugin, {
      prefix: '/',
    });

    await app.register(middlewaresPlugin, { prefix: '/' });

    await app.register(fastifyCors, {
      origin: '*',
      prefix: '/',
    });

    await app.register(swaggerPlugin, { prefix: '/' });

    const routesDir = path.resolve(__dirname, '../routes');
    await app.register(routesPlugin, {
      prefix: '/',
      dirPath: path.resolve(__dirname, '../routes'),
      callback(routeFiles) {
        for (const filePath of routeFiles) {
          const file = filePath
            .replace(/[\\\/]/g, '/')
            .substring(routesDir.length + 1);
          logger.info(
            `Route %s {%s}`,
            colorette.yellow('Registered'),
            colorette.magentaBright(file),
          );
        }
      },
    });

    await app.register(fastifyStatic, {
      root: path.resolve(__dirname, '../../public'),
      prefix: '/',
    });
  },
  {
    name: 'setupPlugin',
  },
);
