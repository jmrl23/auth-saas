import redisStore from '@jmrl23/redis-store';
import { caching } from 'cache-manager';
import fastifyPlugin from 'fastify-plugin';
import { REDIS_URL } from '../lib/constant/environment';
import CacheService from '../services/cache.service';
import UserService from '../services/user.service';

export default fastifyPlugin(
  async function servicesPlugin(app) {
    const userService = await createUserService();

    app.decorate('userService', userService);

    async function createUserService(): Promise<UserService> {
      const cacheStore = await redisStore({
        url: REDIS_URL,
        id: 'auth',
        prefix: 'UserService',
      });
      const cache = await caching(cacheStore);
      const cacheService = new CacheService(cache);
      const userService = new UserService(cacheService);
      return userService;
    }
  },
  {
    name: 'servicesPlugin',
  },
);
