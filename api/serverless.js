const app = require('../build/app');

module.exports = async function serverless(request, response) {
  app.server.emit('request', request, response);
};
