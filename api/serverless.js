import fastify from 'fastify';

const app = fastify();

app.register(import('../build/serverless.js'));

export default async function (request, response) {
  await app.ready();
  app.server.emit('request', request, response);
}
