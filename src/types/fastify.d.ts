import type UserService from '../services/user.service';

export declare module 'fastify' {
  interface FastifyInstance {
    userService: UserService;
  }

  interface FastifyRequest {
    user?: User;
  }
}
