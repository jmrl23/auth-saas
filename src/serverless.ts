import fastify from 'fastify';

const app = fastify();

app.register(require('./app').default);

export default async function (request: Request, response: Response) {
  await app.ready();
  app.server.emit('request', request, response);
}
