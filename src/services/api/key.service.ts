import { Forbidden, NotFound } from 'http-errors';
import moment from 'moment';
import ms from 'ms';
import rs from 'random-string';
import prismaClient from '../../lib/prismaClient';
import type CacheService from '../cache.service';
import type AppService from './app.service';

export default class ApiKeyService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly appService: AppService,
  ) {}

  public async createKey(
    user: User,
    options: {
      expiresDays?: number;
      applications: string[];
    },
  ): Promise<ApiKey> {
    const apiKey = `sk-${rs({
      length: 29,
      numeric: true,
      letters: true,
    })}`;

    const count = await prismaClient.apiKey.count({
      where: {
        apiKey,
      },
    });

    if (count > 0) {
      return await this.createKey(user, options);
    }

    const createdKey = await prismaClient.apiKey.create({
      data: {
        userId: user.id,
        apiKey,
        expires: options.expiresDays
          ? moment(new Date()).add(options.expiresDays, 'days').toDate()
          : undefined,
        applications: options.applications,
      },
    });

    const key = await this.getKeyByIdOrThrow(createdKey.id);
    return key;
  }

  public async getKeyById(
    id: string,
    options: { revalidate?: boolean } = {},
  ): Promise<ApiKey | null> {
    const cacheKey = `key:ref:${id}`;
    const cachedRef = await this.cacheService.get<ApiKey>(cacheKey);

    if (options.revalidate === true) {
      await this.cacheService.del(cacheKey);
    }

    if (cachedRef || cachedRef === null) return cachedRef;

    const key = await prismaClient.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        apiKey: true,
        applications: true,
        expires: true,
        enable: true,
      },
    });

    const applications: {
      id: string;
      name: string;
      origins: string[];
    }[] = [];

    if (key) {
      const appRefs = await Promise.all(
        key.applications.map((id) => this.appService.getAppByIdOrThrow(id)),
      );

      applications.push(
        ...appRefs.map((app) => ({
          id: app.id,
          name: app.name,
          origins: app.origins,
        })),
      );
    }

    const ref = key ? { ...key, applications } : null;

    await this.cacheService.set(cacheKey, ref, ms('5m'));
    return ref;
  }

  public async getKeyByIdOrThrow(
    id: string,
    options: { revalidate?: boolean } = {},
  ): Promise<ApiKey> {
    const key = await this.getKeyById(id, options);
    if (!key) throw new NotFound('API key not found');
    return key;
  }

  public async getKeyByItsKey(
    key: string,
    options: { revalidate?: boolean } = {},
  ): Promise<ApiKey | null> {
    const cacheKey = `key:[ref:key]:${key}`;

    if (options.revalidate === true) {
      await this.cacheService.del(cacheKey);
    }

    const cachedId = await this.cacheService.get<string>(cacheKey);

    if (cachedId === null) return null;

    if (cachedId) {
      const ref = await this.getKeyByIdOrThrow(cachedId);
      return ref;
    }

    const ref = await prismaClient.apiKey.findUnique({
      where: { apiKey: key },
      select: { id: true },
    });

    await this.cacheService.set(cacheKey, ref?.id ?? null, ms('5m'));

    if (!ref) return null;

    const apiKey = await this.getKeyById(ref.id);
    return apiKey;
  }

  public async getKeyByItsKeyOrThrow(
    key: string,
    options: { revalidate?: boolean } = {},
  ): Promise<ApiKey> {
    const ref = await this.getKeyByItsKey(key, options);
    if (!ref) throw new NotFound('API key not found');
    return ref;
  }

  public async getKeyList(
    user: User,
    payload: ApiListPayload & {
      expired?: boolean;
      enable?: boolean;
      applications?: string[];
    },
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
      p.applications?.join('.'),
      p.skip,
      p.take,
      p.order,
    ].join(',')}]`;
    if (revalidate === true) await this.cacheService.del(cacheKey);

    const cachedList = await this.cacheService.get<ApiKey[]>(cacheKey);

    if (cachedList) return cachedList;

    const _ = await prismaClient.apiKey.findMany({
      where: {
        createdAt: {
          gte: p.createdAtFrom ? moment(p.createdAtFrom).toDate() : undefined,
          lte: p.createdAtTo ? moment(p.createdAtTo).toDate() : undefined,
        },
        updatedAt: {
          gte: p.updatedAtFrom ? moment(p.updatedAtFrom).toDate() : undefined,
          lte: p.updatedAtTo ? moment(p.updatedAtTo).toDate() : undefined,
        },
        applications: p.applications ? { hasSome: p.applications } : undefined,
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

    const keyList = await Promise.all(
      _.map((key) => this.getKeyByIdOrThrow(key.id)),
    );

    await this.cacheService.set(cacheKey, keyList, ms('5m'));
    return keyList;
  }

  public async toggleKeyById(
    user: User,
    id: string,
    enable?: boolean,
  ): Promise<ApiKey> {
    await this.keyMustOwned(user, id);
    const ref = await this.getKeyByIdOrThrow(id);

    await prismaClient.apiKey.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        enable: enable === undefined ? !ref.enable : enable,
      },
    });

    const key = await this.getKeyByIdOrThrow(id, { revalidate: true });
    return key;
  }

  public async deleteKeyById(user: User, id: string): Promise<ApiKey> {
    await this.keyMustOwned(user, id);
    const ref = await this.getKeyByIdOrThrow(id);

    await prismaClient.apiKey.delete({
      where: {
        id,
        userId: user.id,
      },
    });

    return ref;
  }

  private async keyOwned(user: User, id: string): Promise<boolean> {
    const key = await this.getKeyByIdOrThrow(id);
    return key.userId !== user.id;
  }

  private async keyMustOwned(user: User, id: string): Promise<void> {
    const isOwned = await this.keyOwned(user, id);
    if (!isOwned) throw new Forbidden('API key not owned');
  }
}
