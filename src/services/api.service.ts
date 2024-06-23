import { Conflict, NotFound, Unauthorized } from 'http-errors';
import moment from 'moment';
import ms from 'ms';
import rs from 'random-string';
import prismaClient from '../lib/prismaClient';
import CacheService from './cache.service';

export default class ApiService {
  constructor(private readonly cacheService: CacheService) {}

  public async createApp(user: User, name: string): Promise<ApiApp> {
    const count = await prismaClient.apiApp.count({
      where: {
        name,
      },
    });

    if (count > 0) throw new Conflict('App already exists');

    const app = await prismaClient.apiApp.create({
      data: {
        name,
        authorId: user.id,
      },
    });

    const apiApp = await this.getAppById(app.id);
    return apiApp!;
  }

  public async getAppById(
    id: string,
    options: Partial<{ revalidate: boolean }> = {},
  ): Promise<ApiApp | null> {
    const cacheKey = `apiApp:${id}`;

    if (options.revalidate === true) await this.cacheService.del(cacheKey);

    const cachedApp = await this.cacheService.get<ApiApp>(cacheKey);

    if (cachedApp) return cachedApp;

    const app = await prismaClient.apiApp.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        author: true,
        name: true,
      },
    });

    await this.cacheService.set(cacheKey, app, ms('5m'));
    return app;
  }

  public async deleteAppById(id: string): Promise<ApiApp> {
    const app = await this.getAppById(id);

    if (!app) throw new NotFound('App not exists');

    await prismaClient.apiApp.delete({
      where: {
        id,
      },
    });

    return app;
  }

  public async getKeyById(
    id: string,
    options: Partial<{ revalidate: boolean }> = {},
  ): Promise<ApiKey | null> {
    const cacheKey = `apiKey:${id}`;
    const cachedApiKey = await this.cacheService.get<ApiKey>(cacheKey);

    if (options.revalidate === true) {
      await this.cacheService.del(cacheKey);
    }

    if (cachedApiKey) return cachedApiKey;

    const apiKey = await prismaClient.apiKey.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        user: true,
        apiKey: true,
        apps: true,
        expires: true,
        enable: true,
      },
    });

    const apps: Array<{
      id: string;
      name: string;
    }> = (
      await Promise.all(apiKey?.apps.map((app) => this.getAppById(app)) ?? [])
    )
      .filter((app) => app !== null)
      .map((app) => ({ id: app.id, name: app.name }));

    const parsedApiKey: ApiKey | null = !apiKey ? null : { ...apiKey, apps };

    await this.cacheService.set(cacheKey, parsedApiKey, ms('5m'));

    return parsedApiKey;
  }

  public async createApiKey(
    user: User,
    options: { expiresDays?: number; apps: string[] },
  ): Promise<ApiKey> {
    const key = await prismaClient.apiKey.create({
      data: {
        userId: user.id,
        apiKey: `sk-${rs({
          length: 29,
          numeric: true,
          letters: true,
        })}`,
        expires: options.expiresDays
          ? moment(new Date()).add(options.expiresDays, 'days').toDate()
          : undefined,
        apps: options.apps,
      },
    });

    const apiKey = await this.getKeyById(key.id);
    return apiKey!;
  }

  public async toggleKeyById(
    user: User,
    id: string,
    enable: boolean,
  ): Promise<ApiKey> {
    const apiKey = await this.getKeyById(id);
    if (!apiKey) throw new NotFound('API key not exists');
    if (id !== user.id) throw new Unauthorized('API key not owned');

    const _apiKey = await prismaClient.apiKey.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        enable,
      },
    });

    const updatedApiKey = await this.getKeyById(_apiKey.id, {
      revalidate: true,
    });

    return updatedApiKey!;
  }

  public async deleteKeyById(user: User, id: string): Promise<ApiKey> {
    const apiKey = await this.getKeyById(id);
    if (!apiKey) throw new NotFound('Api key not exists');
    if (id !== user.id) throw new Unauthorized('API key not owned');

    await prismaClient.apiKey.delete({
      where: {
        id,
        userId: user.id,
      },
    });

    return apiKey;
  }

  public async getStatus(
    key: ApiKey | null,
    app: ApiApp | null,
  ): Promise<{ active: boolean; message?: string }> {
    if (!key) {
      return {
        active: false,
        message: 'Invalid key',
      };
    }

    if (!key.enable) {
      return {
        active: false,
        message: 'Disabled key',
      };
    }

    if (key.expires && key.expires > new Date()) {
      return {
        active: false,
        message: 'Expired key',
      };
    }

    if (!key.apps.find((_app) => _app.id === app?.id)) {
      return {
        active: false,
        message: 'No access',
      };
    }

    return {
      active: true,
    };
  }
}
