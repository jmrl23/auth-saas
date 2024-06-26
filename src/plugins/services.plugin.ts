import redisStore from '@jmrl23/redis-store';
import { caching } from 'cache-manager';
import fastifyPlugin from 'fastify-plugin';
import { REDIS_URL } from '../lib/constant/environment';
import smtpTransport from '../lib/smtpTransport';
import ApiService from '../services/api.service';
import CacheService from '../services/cache.service';
import EmailService from '../services/email.service';
import UserService from '../services/user.service';

export default fastifyPlugin(
  async function servicesPlugin(app) {
    const appId = 'auth';
    const cacheService = await createCacheService();
    const userService = await createUserService();
    const apiService = await createApiService();

    app.decorate('cacheService', cacheService);
    app.decorate('userService', userService);
    app.decorate('apiService', apiService);

    async function createCacheService(): Promise<CacheService> {
      const cacheStore = await redisStore({
        url: REDIS_URL,
        id: appId,
        prefix: 'CacheService',
      });
      const cache = await caching(cacheStore);
      const cacheService = new CacheService(cache);
      return cacheService;
    }

    async function createUserService(): Promise<UserService> {
      const cacheStore = await redisStore({
        url: REDIS_URL,
        id: appId,
        prefix: 'UserService',
      });
      const cache = await caching(cacheStore);
      const cacheService = new CacheService(cache);
      const emailService = new EmailService(smtpTransport);
      const userService = new UserService(cacheService, emailService);
      return userService;
    }

    async function createApiService() {
      const cacheStore = await redisStore({
        url: REDIS_URL,
        id: appId,
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
