import { Conflict, NotFound } from 'http-errors';
import moment from 'moment';
import ms from 'ms';
import prismaClient from '../../lib/prismaClient';
import type CacheService from '../cache.service';

export default class ApiAppService {
  constructor(private readonly cacheService: CacheService) {}

  public async createApp(
    user: User,
    name: string,
    origins: string[],
  ): Promise<ApiApp> {
    const count = await prismaClient.apiApplication.count({
      where: {
        name,
      },
    });

    if (count > 0) throw new Conflict('API application already created');

    const _ = await prismaClient.apiApplication.create({
      data: {
        name,
        authorId: user.id,
        origins,
      },
    });

    const app = await this.getAppById(_.id);
    return app!;
  }

  public async getAppById(
    id: string,
    options: OptionsWithRevalidate = {},
  ): Promise<ApiApp | null> {
    const cacheKey = `application:[ref:id]:${id}`;

    if (options.revalidate === true) await this.cacheService.del(cacheKey);

    const cachedRef = await this.cacheService.get<ApiApp>(cacheKey);

    if (cachedRef || cachedRef === null) return cachedRef;

    const app = await prismaClient.apiApplication.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        name: true,
        origins: true,
      },
    });

    await this.cacheService.set(cacheKey, app, ms('5m'));
    return app;
  }

  public async getAppByIdOrThrow(
    id: string,
    options: OptionsWithRevalidate = {},
  ): Promise<ApiApp> {
    const app = await this.getAppById(id, options);
    if (!app) throw new NotFound('API application not found');
    return app;
  }

  public async setAppOriginsById(
    id: string,
    origins: string[],
  ): Promise<ApiApp> {
    await prismaClient.apiApplication.update({
      where: {
        id,
      },
      data: {
        origins,
      },
    });

    const app = await this.getAppByIdOrThrow(id, { revalidate: true });
    return app;
  }

  public async getAppList(
    payload: ApiListPayload & {
      name?: string;
      authorId?: string;
    },
  ): Promise<ApiApp[]> {
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

    const cachedList = await this.cacheService.get<ApiApp[]>(cacheKey);

    if (cachedList) return cachedList;

    const _ = await prismaClient.apiApplication.findMany({
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

    const appList = await Promise.all(
      _.map((app) => this.getAppByIdOrThrow(app.id)),
    );

    await this.cacheService.set(cacheKey, appList, ms('5m'));
    return appList;
  }

  public async deleteAppById(id: string): Promise<ApiApp> {
    const ref = await this.getAppByIdOrThrow(id);

    await prismaClient.apiApplication.delete({
      where: {
        id,
      },
    });

    const app = await this.getAppByIdOrThrow(ref.id, { revalidate: true });
    return app;
  }
}
