const fastify = require('fastify');
const app = fastify();

app.register(require('../build/serverless'));

async function handler(request, response) {
  await app.ready();
  app.server.emit('request', request, response);
}

module.exports = handler;
