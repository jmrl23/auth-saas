import fastify from 'fastify';

const app = fastify();

app.register(import('../serverless'));

export default async function serverless(request: Request, response: Response) {
  await app.ready();
  app.server.emit('request', request, response);
}
