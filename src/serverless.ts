import fastify from 'fastify';

const app = fastify();

app.register(import('./app.serverless'));

export default async function (request: Request, response: Response) {
  await app.ready();
  app.server.emit('request', request, response);
}
