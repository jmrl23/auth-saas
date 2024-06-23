import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(
  async function userPlugin(app) {
    app.addHook('preHandler', async function userPreHandler(request) {
      const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
      if (scheme !== 'Bearer') return;
      const user = await this.userService.getUserByToken(token);
      if (user) {
        request.user = user;
      }
    });
  },
  {
    name: 'userPlugin',
  },
);
