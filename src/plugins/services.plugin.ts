import redisStore from '@jmrl23/redis-store';
import { caching } from 'cache-manager';
import fastifyPlugin from 'fastify-plugin';
import { REDIS_URL } from '../lib/constant/environment';
import smtpTransport from '../lib/smtpTransport';
import ApiService from '../services/api.service';
import ApiAppService from '../services/api/app.service';
import ApiKeyService from '../services/api/key.service';
import CacheService from '../services/cache.service';
import EmailService from '../services/email.service';
import UserService from '../services/user.service';
import UserEmailService from '../services/user/email.service';
import UserInfoService from '../services/user/info.service';
import { UserSessionService } from '../services/user/session.service';

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
      const userInfoService = new UserInfoService(cacheService);
      const userEmailService = new UserEmailService(cacheService, emailService);
      const userSessionService = new UserSessionService(cacheService);
      const userService = new UserService(
        cacheService,
        userInfoService,
        userEmailService,
        userSessionService,
      );
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
      const apiAppService = new ApiAppService(cacheService);
      const apiKeyService = new ApiKeyService(cacheService, apiAppService);
      const apiService = new ApiService(apiAppService, apiKeyService);
      return apiService;
    }
  },
  {
    name: 'servicesPlugin',
  },
);
