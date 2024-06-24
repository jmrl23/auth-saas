const fastify = require('fastify');

const app = fastify();

app.register(require('../build/serverless.js'));

module.exports = async function serverless(request, response) {
  await app.ready();
  app.server.emit('request', request, response);
};
