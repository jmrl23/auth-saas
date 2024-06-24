import { Conflict, NotFound, Unauthorized } from 'http-errors';
import moment from 'moment';
import ms from 'ms';
import rs from 'random-string';
import prismaClient from '../lib/prismaClient';
import CacheService from './cache.service';

export default class ApiService {
  constructor(private readonly cacheService: CacheService) {}

  public async createApp(
    user: User,
    name: string,
    urls: string[],
  ): Promise<ApiApplication> {
    const count = await prismaClient.apiApplication.count({
      where: {
        name,
      },
    });

    if (count > 0) throw new Conflict('API application already created');

    const app = await prismaClient.apiApplication.create({
      data: {
        name,
        authorId: user.id,
        urls,
      },
    });

    const apiApp = await this.getAppById(app.id);
    return apiApp!;
  }

  public async getAppById(
    id: string,
    options: Partial<{ revalidate: boolean }> = {},
  ): Promise<ApiApplication | null> {
    const cacheKey = `application:${id}`;

    if (options.revalidate === true) await this.cacheService.del(cacheKey);

    const cachedApp = await this.cacheService.get<ApiApplication>(cacheKey);

    if (cachedApp) return cachedApp;

    const app = await prismaClient.apiApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        name: true,
        urls: true,
      },
    });

    await this.cacheService.set(cacheKey, app, ms('5m'));
    return app;
  }

  public async getAppList(
    payload: ListPayload &
      Partial<{
        name: string;
        authorId: string;
      }>,
  ): Promise<ApiApplication[]> {
    const { revalidate, ...p } = payload;
    const cacheKey = `application:list:[${[
      p.createdAtFrom,
      p.createdAtTo,
      p.updatedAtFrom,
      p.updatedAtTo,
      p.name,
      p.authorId,
      p.skip,
      p.take,
      p.order,
    ].join(',')}]`;
    if (revalidate === true) await this.cacheService.del(cacheKey);
    const cachedList = await this.cacheService.get<ApiApplication[]>(cacheKey);
    if (cachedList) return cachedList;

    const appList = await prismaClient.apiApplication.findMany({
      where: {
        createdAt: {
          gte: p.createdAtFrom ? moment(p.createdAtFrom).toDate() : undefined,
          lte: p.createdAtTo ? moment(p.createdAtTo).toDate() : undefined,
        },
        updatedAt: {
          gte: p.updatedAtFrom ? moment(p.updatedAtFrom).toDate() : undefined,
          lte: p.updatedAtTo ? moment(p.updatedAtTo).toDate() : undefined,
        },
        name: {
          startsWith: p.name,
        },
        authorId: p.authorId,
      },
      skip: p.skip,
      take: p.take,
      orderBy: {
        createdAt: p.order,
      },
    });

    const parsedAppList = (
      await Promise.all(appList.map((app) => this.getAppById(app.id)))
    ).filter((app) => app !== null);

    await this.cacheService.set(cacheKey, parsedAppList, ms('5m'));
    return parsedAppList;
  }

  public async deleteAppById(id: string): Promise<ApiApplication> {
    const app = await this.getAppById(id);

    if (!app) throw new NotFound('API application not found');

    await prismaClient.apiApplication.delete({
      where: {
        id,
      },
    });

    await this.getAppById(id, { revalidate: true });
    return app;
  }

  public async getKeyById(
    id: string,
    options: Partial<{ revalidate: boolean }> = {},
  ): Promise<ApiKey | null> {
    const cacheKey = `key:${id}`;
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
        userId: true,
        apiKey: true,
        apps: true,
        expires: true,
        enable: true,
      },
    });

    const apps: Array<{
      id: string;
      name: string;
      urls: string[];
    }> = (
      await Promise.all(apiKey?.apps.map((app) => this.getAppById(app)) ?? [])
    )
      .filter((app) => app !== null)
      .map((app) => ({ id: app.id, name: app.name, urls: app.urls }));

    const parsedApiKey: ApiKey | null = !apiKey ? null : { ...apiKey, apps };

    await this.cacheService.set(cacheKey, parsedApiKey, ms('5m'));
    return parsedApiKey;
  }

  public async createKey(
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

  public async getKeyList(
    user: User,
    payload: ListPayload &
      Partial<{
        expired: boolean;
        enable: boolean;
        apps: string[];
      }>,
  ): Promise<ApiKey[]> {
    const { revalidate, ...p } = payload;
    const cacheKey = `application:list:[${[
      user.id,
      p.createdAtFrom,
      p.createdAtTo,
      p.updatedAtFrom,
      p.updatedAtTo,
      p.expired,
      p.enable,
      p.apps?.join('.'),
      p.skip,
      p.take,
      p.order,
    ].join(',')}]`;
    if (revalidate === true) await this.cacheService.del(cacheKey);
    const cachedList = await this.cacheService.get<ApiKey[]>(cacheKey);
    if (cachedList) return cachedList;

    const keyList = await prismaClient.apiKey.findMany({
      where: {
        createdAt: {
          gte: p.createdAtFrom ? moment(p.createdAtFrom).toDate() : undefined,
          lte: p.createdAtTo ? moment(p.createdAtTo).toDate() : undefined,
        },
        updatedAt: {
          gte: p.updatedAtFrom ? moment(p.updatedAtFrom).toDate() : undefined,
          lte: p.updatedAtTo ? moment(p.updatedAtTo).toDate() : undefined,
        },
        apps: p.apps ? { hasSome: p.apps } : undefined,
        enable: p.enable,
        expires: !p.expired
          ? undefined
          : {
              lte: new Date(),
            },
      },
      skip: p.skip,
      take: p.take,
      orderBy: {
        createdAt: p.order,
      },
    });

    const parsedKeyList = (
      await Promise.all(keyList.map((key) => this.getKeyById(key.id)))
    ).filter((key) => key !== null);

    await this.cacheService.set(cacheKey, parsedKeyList, ms('5m'));
    return parsedKeyList;
  }

  public async toggleKeyById(
    user: User,
    id: string,
    enable?: boolean,
  ): Promise<ApiKey> {
    const key = await this.getKeyById(id);
    if (!key) throw new NotFound('API key not found');
    if (key.userId !== user.id) throw new Unauthorized('API key not owned');

    const _key = await prismaClient.apiKey.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        enable: enable === undefined ? !key.enable : enable,
      },
    });

    const updatedKey = await this.getKeyById(_key.id, {
      revalidate: true,
    });
    return updatedKey!;
  }

  public async deleteKeyById(user: User, id: string): Promise<ApiKey> {
    const key = await this.getKeyById(id);
    if (!key) throw new NotFound('API key not found');
    if (key.userId !== user.id) throw new Unauthorized('API key not owned');

    await prismaClient.apiKey.delete({
      where: {
        id,
        userId: user.id,
      },
    });

    await this.getKeyById(id, { revalidate: true });
    return key;
  }

  public async getKeyStatus(
    host?: string,
    apiKey?: string,
  ): Promise<KeyStatus> {
    if (!host) {
      return {
        active: false,
        message: 'Cannot identify application source',
      };
    }
    if (!apiKey) {
      return {
        active: false,
        message: 'API key missing',
      };
    }
    const cacheKey = `apiKey:${apiKey}`;
    let id: string;
    const cachedId = await this.cacheService.get<string>(cacheKey);
    if (cachedId) {
      id = cachedId;
    } else {
      id =
        (
          await prismaClient.apiKey.findUnique({
            where: {
              apiKey,
            },
            select: {
              id: true,
            },
          })
        )?.id ?? 'no-reference';
      await this.cacheService.set(cacheKey, id, ms('5m'));
    }
    const api = await this.getKeyById(id);

    if (!api) {
      return {
        active: false,
        message: 'API key is invalid',
      };
    }

    if (api.expires && api.expires < new Date()) {
      return {
        active: false,
        message: 'API key expired',
      };
    }

    const urls = api.apps
      .map((app) => app.urls.map((url) => new URL(url)))
      .flat(1);

    if (urls.every((url) => host !== url.host)) {
      return {
        active: false,
        message: 'API key does not support the application',
      };
    }

    return {
      active: true,
    };
  }
}

interface KeyStatus {
  active: boolean;
  message?: string;
}

interface ListPayload {
  revalidate?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  skip?: number;
  take?: number;
  order?: 'asc' | 'desc';
}
