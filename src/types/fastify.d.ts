import type ApiService from '../services/api.service';
import type CacheService from '../services/cache.service';
import type UserService from '../services/user.service';

export declare module 'fastify' {
  interface FastifyInstance {
    cacheService: CacheService;
    userService: UserService;
    apiService: ApiService;
  }

  interface FastifyRequest {
    user?: User;
  }
}
