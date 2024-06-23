import redisStore from '@jmrl23/redis-store';
import { caching } from 'cache-manager';
import fastifyPlugin from 'fastify-plugin';
import { REDIS_URL } from '../lib/constant/environment';
import ApiService from '../services/api.service';
import CacheService from '../services/cache.service';
import UserService from '../services/user.service';

export default fastifyPlugin(
  async function servicesPlugin(app) {
    const userService = await createUserService();
    const apiService = await createApiService();

    app.decorate('userService', userService);
    app.decorate('apiService', apiService);

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

    async function createApiService() {
      const cacheStore = await redisStore({
        url: REDIS_URL,
        id: 'auth',
        prefix: 'ApiService',
      });
      const cache = await caching(cacheStore);
      const cacheService = new CacheService(cache);
      const apiService = new ApiService(cacheService);
      return apiService;
    }
  },
  {
    name: 'servicesPlugin',
  },
);
