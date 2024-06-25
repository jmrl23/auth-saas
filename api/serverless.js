const app = require('../build/app');

module.exports = async function serverless(request, response) {
  await app.ready();
  app.server.emit('request', request, response);
};
