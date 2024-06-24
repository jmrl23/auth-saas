import app from './app';

export default async function (request: Request, response: Response) {
  await app.ready();
  app.server.emit('request', request, response);
}
