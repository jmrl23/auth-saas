import type ApiService from '../services/api.service';
import type UserService from '../services/user.service';

export declare module 'fastify' {
  interface FastifyInstance {
    userService: UserService;
    apiService: ApiService;
  }

  interface FastifyRequest {
    user?: User;
  }
}
